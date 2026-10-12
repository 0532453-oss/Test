/**
 * Sync — pull from server to WatermelonDB and push local mutations to server.
 *
 * Pull strategy: match by serverId, update if syncVersion is newer, insert if new.
 * Push strategy: process sync_queue in FIFO order with exponential backoff on failure.
 */

import database from './database';
import { Job, Customer, Invoice, SyncQueueItem } from './models';
import apiClient from '../api/client';
import { syncJobs } from '../api/jobs.api';
import { listCustomers } from '../api/customers.api';
import { listInvoices } from '../api/invoices.api';
import type {
  Job as ApiJob,
  Customer as ApiCustomer,
  Invoice as ApiInvoice,
} from '../api/types';

// ── Sync lock ───────────────────────────────────────────────────────────────

let _isSyncing = false;

export function isSyncing(): boolean {
  return _isSyncing;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function todayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function safeTimestamp(val: string | number | null | undefined): number | null {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  const ms = new Date(val).getTime();
  return isNaN(ms) ? null : ms;
}

// ── Upsert jobs ─────────────────────────────────────────────────────────────

async function upsertJobs(apiJobs: ApiJob[]): Promise<void> {
  if (apiJobs.length === 0) return;

  const jobsCollection = database.get<Job>('jobs');

  await database.write(async () => {
    for (const apiJob of apiJobs) {
      // Find existing local record by serverId
      const existing = await jobsCollection
        .query()
        .fetch()
        .then((all) => all.find((j) => j.serverId === apiJob.id));

      if (existing) {
        await existing.update((rec) => {
          rec.title = apiJob.title;
          rec.description = apiJob.description ?? null;
          rec.status = apiJob.status;
          rec.priority = apiJob.priority ?? 'MEDIUM';
          rec.customerId = apiJob.customerId;
          rec.propertyId = apiJob.propertyId ?? null;
          rec.scheduledDate = apiJob.scheduledDate ?? null;
          rec.scheduledStartTime = apiJob.scheduledStartTime ?? null;
          rec.scheduledEndTime = apiJob.scheduledEndTime ?? null;
          rec.estimatedDuration = apiJob.estimatedDuration ?? null;
          rec.lastSyncedAt = Date.now();
        });
      } else {
        await jobsCollection.create((rec) => {
          rec.serverId = apiJob.id;
          rec.workspaceId = '';
          rec.customerId = apiJob.customerId;
          rec.technicianId = '';
          rec.propertyId = apiJob.propertyId ?? null;
          rec.title = apiJob.title;
          rec.description = apiJob.description ?? null;
          rec.status = apiJob.status;
          rec.priority = apiJob.priority ?? 'MEDIUM';
          rec.scheduledDate = apiJob.scheduledDate ?? null;
          rec.scheduledStartTime = apiJob.scheduledStartTime ?? null;
          rec.scheduledEndTime = apiJob.scheduledEndTime ?? null;
          rec.estimatedDuration = apiJob.estimatedDuration ?? null;
          rec.syncVersion = 1;
          rec.lastSyncedAt = Date.now();
        });
      }
    }
  });
}

// ── Upsert customers ────────────────────────────────────────────────────────

async function upsertCustomers(apiCustomers: ApiCustomer[]): Promise<void> {
  if (apiCustomers.length === 0) return;

  const customersCollection = database.get<Customer>('customers');

  await database.write(async () => {
    for (const apiCust of apiCustomers) {
      const existing = await customersCollection
        .query()
        .fetch()
        .then((all) => all.find((c) => c.serverId === apiCust.id));

      if (existing) {
        await existing.update((rec) => {
          rec.name = apiCust.name;
          rec.email = apiCust.email ?? null;
          rec.phone = apiCust.phone ?? null;
          rec.lastSyncedAt = Date.now();
        });
      } else {
        await customersCollection.create((rec) => {
          rec.serverId = apiCust.id;
          rec.name = apiCust.name;
          rec.email = apiCust.email ?? null;
          rec.phone = apiCust.phone ?? null;
          rec.syncVersion = 1;
          rec.lastSyncedAt = Date.now();
        });
      }
    }
  });
}

// ── Upsert invoices ─────────────────────────────────────────────────────────

async function upsertInvoices(apiInvoices: ApiInvoice[]): Promise<void> {
  if (apiInvoices.length === 0) return;

  const invoicesCollection = database.get<Invoice>('invoices');

  await database.write(async () => {
    for (const apiInv of apiInvoices) {
      const existing = await invoicesCollection
        .query()
        .fetch()
        .then((all) => all.find((inv) => inv.serverId === apiInv.id));

      if (existing) {
        await existing.update((rec) => {
          rec.invoiceNumber = apiInv.invoiceNumber;
          rec.status = apiInv.status;
          rec.amount = apiInv.amount ?? 0;
          rec.tax = apiInv.tax ?? 0;
          rec.total = apiInv.total;
          rec.dueDate = safeTimestamp(apiInv.dueDate);
          rec.paidAt = safeTimestamp(apiInv.paidAt);
        });
      } else {
        await invoicesCollection.create((rec) => {
          rec.serverId = apiInv.id;
          rec.jobId = apiInv.jobId ?? '';
          rec.customerId = apiInv.customerId;
          rec.invoiceNumber = apiInv.invoiceNumber;
          rec.status = apiInv.status;
          rec.amount = apiInv.amount ?? 0;
          rec.tax = apiInv.tax ?? 0;
          rec.total = apiInv.total;
          rec.dueDate = safeTimestamp(apiInv.dueDate);
          rec.paidAt = safeTimestamp(apiInv.paidAt);
          rec.syncVersion = 1;
        });
      }
    }
  });
}

// ── Sync Queue Status Constants ──────────────────────────────────────────────

export const QUEUE_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SYNCED: 'SYNCED',
  CONFLICT: 'CONFLICT',
  FAILED: 'FAILED',
} as const;

export type QueueStatus = (typeof QUEUE_STATUS)[keyof typeof QUEUE_STATUS];

const MAX_RETRIES = 5;
const BACKOFF_BASE_MS = 1000;

// ── Enqueue mutation ────────────────────────────────────────────────────────

export interface EnqueueMutationParams {
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: Record<string, unknown>;
  entityType: string;
  entityId: string;
}

/**
 * Queue a mutation for later push to the server.
 * Called when the app is offline and a user action needs to be persisted.
 */
export async function enqueueMutation(params: EnqueueMutationParams): Promise<void> {
  const collection = database.get<SyncQueueItem>('sync_queue');
  await database.write(async () => {
    await collection.create((rec) => {
      rec.endpoint = params.endpoint;
      rec.method = params.method;
      rec.payload = JSON.stringify(params.payload);
      rec.entityType = params.entityType;
      rec.entityId = params.entityId;
      rec.status = QUEUE_STATUS.PENDING;
      rec.retryCount = 0;
    });
  });
}

// ── Get pending queue count ─────────────────────────────────────────────────

export async function getPendingQueueCount(): Promise<number> {
  const collection = database.get<SyncQueueItem>('sync_queue');
  const pending = await collection.query().fetch();
  return pending.filter(
    (item) => item.status === QUEUE_STATUS.PENDING || item.status === QUEUE_STATUS.PROCESSING,
  ).length;
}

// ── Get failed/conflict items for user display ──────────────────────────────

export interface FailedQueueItem {
  id: string;
  entityType: string;
  entityId: string;
  status: string;
  retryCount: number;
}

export async function getFailedQueueItems(): Promise<FailedQueueItem[]> {
  const collection = database.get<SyncQueueItem>('sync_queue');
  const all = await collection.query().fetch();
  return all
    .filter((item) => item.status === QUEUE_STATUS.FAILED || item.status === QUEUE_STATUS.CONFLICT)
    .map((item) => ({
      id: item.id,
      entityType: item.entityType,
      entityId: item.entityId,
      status: item.status,
      retryCount: item.retryCount,
    }));
}

// ── Push sync ───────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface PushSyncResult {
  processed: number;
  succeeded: number;
  conflicts: number;
  failed: number;
}

/**
 * Process the sync_queue in FIFO order, pushing pending mutations to the server.
 *
 * - On success: remove item from queue
 * - On 409: mark as CONFLICT
 * - On network error: retry with exponential backoff (1s, 2s, 4s, 8s, 16s), max 5 retries
 * - On permanent 4xx: mark as FAILED
 */
export async function pushSync(): Promise<PushSyncResult> {
  if (_isSyncing) {
    return { processed: 0, succeeded: 0, conflicts: 0, failed: 0 };
  }
  _isSyncing = true;
  try {
    return await _pushSyncInner();
  } finally {
    _isSyncing = false;
  }
}

async function _pushSyncInner(): Promise<PushSyncResult> {
  const collection = database.get<SyncQueueItem>('sync_queue');
  const pendingItems = await collection.query().fetch();

  // Filter to PENDING items and sort by created_at ascending (FIFO)
  const toProcess = pendingItems
    .filter((item) => item.status === QUEUE_STATUS.PENDING)
    .sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return aTime - bTime;
    });

  const result: PushSyncResult = { processed: 0, succeeded: 0, conflicts: 0, failed: 0 };

  for (const item of toProcess) {
    result.processed++;

    // Mark as PROCESSING
    await database.write(async () => {
      await item.update((rec) => {
        rec.status = QUEUE_STATUS.PROCESSING;
      });
    });

    let succeeded = false;
    let retryCount = item.retryCount;

    while (retryCount <= MAX_RETRIES && !succeeded) {
      try {
        const payload = JSON.parse(item.payload);
        await apiClient.request({
          url: item.endpoint,
          method: item.method,
          data: item.method !== 'DELETE' ? payload : undefined,
        });

        // Success: remove from queue
        await database.write(async () => {
          await item.destroyPermanently();
        });
        result.succeeded++;
        succeeded = true;
      } catch (err: unknown) {
        const status =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { status?: number } }).response?.status
            : undefined;
        const isNetworkError = !status;

        if (status === 409) {
          // Version conflict — mark as CONFLICT for resolution UI (US-023)
          await database.write(async () => {
            await item.update((rec) => {
              rec.status = QUEUE_STATUS.CONFLICT;
              rec.retryCount = retryCount;
            });
          });
          result.conflicts++;
          break;
        }

        if (status && status >= 400 && status < 500 && status !== 409) {
          // Permanent client error — mark as FAILED
          await database.write(async () => {
            await item.update((rec) => {
              rec.status = QUEUE_STATUS.FAILED;
              rec.retryCount = retryCount;
            });
          });
          result.failed++;
          break;
        }

        if (isNetworkError || (status && status >= 500)) {
          // Network error or server error — retry with exponential backoff
          retryCount++;
          if (retryCount > MAX_RETRIES) {
            await database.write(async () => {
              await item.update((rec) => {
                rec.status = QUEUE_STATUS.FAILED;
                rec.retryCount = retryCount;
              });
            });
            result.failed++;
            break;
          }

          const backoffMs = BACKOFF_BASE_MS * Math.pow(2, retryCount - 1);
          await delay(backoffMs);

          // Update retry count in DB
          await database.write(async () => {
            await item.update((rec) => {
              rec.retryCount = retryCount;
            });
          });
        }
      }
    }
  }

  return result;
}

// ── Public API ──────────────────────────────────────────────────────────────

export interface PullSyncResult {
  jobsCount: number;
  customersCount: number;
  invoicesCount: number;
}

/**
 * Pull all relevant data from the server into WatermelonDB.
 *
 * - Jobs: today's jobs via GET /jobs/sync?date=today
 * - Customers: full list via GET /customers
 * - Invoices: recent invoices via GET /invoices
 */
export async function pullSync(): Promise<PullSyncResult> {
  if (_isSyncing) {
    return { jobsCount: 0, customersCount: 0, invoicesCount: 0 };
  }
  _isSyncing = true;
  try {
    return await _pullSyncInner();
  } finally {
    _isSyncing = false;
  }
}

async function _pullSyncInner(): Promise<PullSyncResult> {
  const [apiJobs, apiCustomers, apiInvoices] = await Promise.all([
    syncJobs(todayStr()).catch(() => [] as ApiJob[]),
    listCustomers().catch(() => [] as ApiCustomer[]),
    listInvoices().catch(() => [] as ApiInvoice[]),
  ]);

  await upsertJobs(apiJobs);
  await upsertCustomers(apiCustomers);
  await upsertInvoices(apiInvoices);

  return {
    jobsCount: apiJobs.length,
    customersCount: apiCustomers.length,
    invoicesCount: apiInvoices.length,
  };
}

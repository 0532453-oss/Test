/**
 * Sync Manager for offline-first operations
 * Manages the queue of operations to sync when back online
 *
 * Debug features:
 * - Event history ring buffer (last 100 events)
 * - Debug event listeners for real-time monitoring
 * - Error categorization for failure diagnostics
 * - Per-operation timing
 */

import { indexedDBClient } from './indexedDB';

export enum SyncOperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum SyncOperationStatus {
  PENDING = 'PENDING',
  SYNCING = 'SYNCING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

const MAX_RETRY_COUNT = 5;
const MAX_BATCH_SIZE = 50;
const MAX_EVENT_HISTORY = 100;

export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  entityType: string;
  entityId: string;
  data: unknown;
  endpoint: string;
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  status: SyncOperationStatus;
  retryCount: number;
  createdAt: string;
  lastAttemptAt?: string;
  error?: string;
}

export type SyncErrorCategory = 'network' | 'auth' | 'validation' | 'server' | 'timeout' | 'unknown';

export interface SyncEvent {
  timestamp: string;
  type: 'queued' | 'syncing' | 'completed' | 'failed' | 'retry' | 'online' | 'offline' | 'batch_start' | 'batch_end';
  operationId?: string;
  entityType?: string;
  endpoint?: string;
  error?: string;
  errorCategory?: SyncErrorCategory;
  durationMs?: number;
  batchSize?: number;
}

type SyncCallback = (operations: SyncOperation[]) => Promise<void>;
type DebugListener = (event: SyncEvent) => void;

class SyncManager {
  private online: boolean = true;
  private syncInProgress: boolean = false;
  private syncCallback: SyncCallback | null = null;
  private listeners: Set<(online: boolean) => void> = new Set();

  // Debug infrastructure
  private eventHistory: SyncEvent[] = [];
  private debugListeners: Set<DebugListener> = new Set();
  private lastSyncAt: string | null = null;
  private lastError: string | null = null;

  constructor() {
    // Initialize online status
    if (typeof window !== 'undefined') {
      this.online = navigator.onLine;

      window.addEventListener('online', () => {
        this.online = true;
        this.emit({ timestamp: new Date().toISOString(), type: 'online' });
        this.notifyListeners();
        this.processSyncQueue();
      });

      window.addEventListener('offline', () => {
        this.online = false;
        this.emit({ timestamp: new Date().toISOString(), type: 'offline' });
        this.notifyListeners();
      });
    }
  }

  // ─── Public API ──────────────────────────────────────

  isOnline(): boolean {
    return this.online;
  }

  addOnlineListener(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  setSyncCallback(callback: SyncCallback): void {
    this.syncCallback = callback;
  }

  async queueOperation(operation: Omit<SyncOperation, 'id' | 'status' | 'retryCount' | 'createdAt'>): Promise<SyncOperation> {
    const syncOp: SyncOperation = {
      ...operation,
      id: crypto.randomUUID(),
      status: SyncOperationStatus.PENDING,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    await indexedDBClient.put('syncQueue', syncOp);

    this.emit({
      timestamp: syncOp.createdAt,
      type: 'queued',
      operationId: syncOp.id,
      entityType: syncOp.entityType,
      endpoint: syncOp.endpoint,
    });

    if (this.online) {
      this.processSyncQueue();
    }

    return syncOp;
  }

  async getPendingOperations(): Promise<SyncOperation[]> {
    return indexedDBClient.getByIndex<SyncOperation>('syncQueue', 'status', SyncOperationStatus.PENDING);
  }

  async getAllOperations(): Promise<SyncOperation[]> {
    return indexedDBClient.getAll<SyncOperation>('syncQueue');
  }

  async updateOperationStatus(
    id: string,
    status: SyncOperationStatus,
    error?: string
  ): Promise<void> {
    const operation = await indexedDBClient.get<SyncOperation>('syncQueue', id);
    if (operation) {
      operation.status = status;
      operation.lastAttemptAt = new Date().toISOString();
      if (status === SyncOperationStatus.FAILED) {
        operation.retryCount++;
        operation.error = error;
        this.lastError = error || null;

        this.emit({
          timestamp: operation.lastAttemptAt,
          type: operation.retryCount < MAX_RETRY_COUNT ? 'retry' : 'failed',
          operationId: id,
          entityType: operation.entityType,
          endpoint: operation.endpoint,
          error,
          errorCategory: this.categorizeError(error),
        });
      } else if (status === SyncOperationStatus.COMPLETED) {
        this.emit({
          timestamp: operation.lastAttemptAt,
          type: 'completed',
          operationId: id,
          entityType: operation.entityType,
          endpoint: operation.endpoint,
        });
      }
      await indexedDBClient.put('syncQueue', operation);
    }
  }

  async removeOperation(id: string): Promise<void> {
    await indexedDBClient.remove('syncQueue', id);
  }

  async clearCompletedOperations(): Promise<void> {
    const operations = await this.getAllOperations();
    const toRemove = operations.filter(
      (op) =>
        op.status === SyncOperationStatus.COMPLETED ||
        (op.status === SyncOperationStatus.FAILED && op.retryCount >= 3)
    );

    await Promise.all(toRemove.map((op) => this.removeOperation(op.id)));
  }

  async processSyncQueue(): Promise<void> {
    if (!this.online || this.syncInProgress || !this.syncCallback) {
      return;
    }

    this.syncInProgress = true;
    const batchStartTime = Date.now();

    try {
      const allPendingOps = await this.getPendingOperations();

      const pendingOps = allPendingOps.filter(op => op.retryCount < MAX_RETRY_COUNT);

      const permanentlyFailed = allPendingOps.filter(op => op.retryCount >= MAX_RETRY_COUNT);
      await Promise.all(
        permanentlyFailed.map(op =>
          this.updateOperationStatus(op.id, SyncOperationStatus.FAILED, 'Max retry count exceeded')
        )
      );

      if (pendingOps.length > 0) {
        const batch = pendingOps.slice(0, MAX_BATCH_SIZE);

        this.emit({
          timestamp: new Date().toISOString(),
          type: 'batch_start',
          batchSize: batch.length,
        });

        // Mark operations as syncing
        await Promise.all(
          batch.map((op) => {
            this.emit({
              timestamp: new Date().toISOString(),
              type: 'syncing',
              operationId: op.id,
              entityType: op.entityType,
              endpoint: op.endpoint,
            });
            return this.updateOperationStatus(op.id, SyncOperationStatus.SYNCING);
          })
        );

        // Process operations
        await this.syncCallback(batch);

        this.lastSyncAt = new Date().toISOString();

        this.emit({
          timestamp: this.lastSyncAt,
          type: 'batch_end',
          batchSize: batch.length,
          durationMs: Date.now() - batchStartTime,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.lastError = message;
      this.emit({
        timestamp: new Date().toISOString(),
        type: 'failed',
        error: message,
        errorCategory: this.categorizeError(message),
        durationMs: Date.now() - batchStartTime,
      });
    } finally {
      this.syncInProgress = false;
    }
  }

  async forceSync(): Promise<void> {
    if (!this.online) {
      throw new Error('Cannot sync while offline');
    }
    await this.processSyncQueue();
  }

  async getQueueStatus(): Promise<{
    pending: number;
    syncing: number;
    failed: number;
    total: number;
  }> {
    const operations = await this.getAllOperations();

    return {
      pending: operations.filter((op) => op.status === SyncOperationStatus.PENDING).length,
      syncing: operations.filter((op) => op.status === SyncOperationStatus.SYNCING).length,
      failed: operations.filter((op) => op.status === SyncOperationStatus.FAILED).length,
      total: operations.length,
    };
  }

  // ─── Debug API ───────────────────────────────────────

  addDebugListener(callback: DebugListener): () => void {
    this.debugListeners.add(callback);
    return () => this.debugListeners.delete(callback);
  }

  getEventHistory(): SyncEvent[] {
    return [...this.eventHistory];
  }

  getLastSyncAt(): string | null {
    return this.lastSyncAt;
  }

  getLastError(): string | null {
    return this.lastError;
  }

  async getFailedOperationDetails(): Promise<Array<{
    operation: SyncOperation;
    errorCategory: SyncErrorCategory;
  }>> {
    const operations = await this.getAllOperations();
    return operations
      .filter((op) => op.status === SyncOperationStatus.FAILED)
      .map((op) => ({
        operation: op,
        errorCategory: this.categorizeError(op.error),
      }));
  }

  clearEventHistory(): void {
    this.eventHistory = [];
  }

  // ─── Private ─────────────────────────────────────────

  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.online));
  }

  private emit(event: SyncEvent): void {
    this.eventHistory.push(event);
    if (this.eventHistory.length > MAX_EVENT_HISTORY) {
      this.eventHistory.shift();
    }
    this.debugListeners.forEach((cb) => {
      try { cb(event); } catch { /* ignore listener errors */ }
    });
  }

  private categorizeError(error?: string): SyncErrorCategory {
    if (!error) return 'unknown';
    const lower = error.toLowerCase();
    if (lower.includes('fetch') || lower.includes('network') || lower.includes('failed to fetch') || lower.includes('net::')) return 'network';
    if (lower.includes('401') || lower.includes('403') || lower.includes('unauthorized') || lower.includes('forbidden')) return 'auth';
    if (lower.includes('400') || lower.includes('422') || lower.includes('validation')) return 'validation';
    if (lower.includes('500') || lower.includes('502') || lower.includes('503') || lower.includes('internal server')) return 'server';
    if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('aborted')) return 'timeout';
    return 'unknown';
  }
}

// Singleton instance
export const syncManager = new SyncManager();

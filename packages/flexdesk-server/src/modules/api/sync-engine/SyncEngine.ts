/**
 * Sync Engine - Partial Sync Implementation
 * 
 * Implements partial sync strategy to optimize mobile bundle size.
 * Only syncs current day's schedule to reduce data transfer.
 */

import { apiClient } from '../client/apiClient';
import { indexedDBClient } from '../storage/IndexedDBClient';

import type { Job, SyncStatus as JobSyncStatus } from '@/modules/jobs/types/Job';

function format(date: Date, formatStr: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  if (formatStr === 'yyyy-MM-dd') return `${year}-${month}-${day}`;
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export interface SyncFilters {
  date?: Date;
  technicianId?: string;
  entityType?: 'Job' | 'Technician' | 'Customer' | 'Invoice';
}

export interface SyncMetadata {
  key: string;
  value: any;
  updatedAt: number;
}

export enum SyncStrategy {
  INCREMENTAL = 'INCREMENTAL', // Only sync changes since last sync
  FULL = 'FULL', // Sync all records
  DATE_RANGE = 'DATE_RANGE', // Sync records within date range
}

export class SyncEngine {
  /**
   * Sync technician schedule for current day only
   */
  async syncTechnicianSchedule(
    date: Date = new Date()
  ): Promise<void> {
    const today = format(date, 'yyyy-MM-dd');
    
    try {
      // Fetch jobs for current day
      const response = await apiClient.get<Job[]>(
        `/jobs/sync?date=${today}`,
        { skipCache: true }
      );

      const rawJobs = Array.isArray(response.data)
        ? response.data
        : [response.data];

      const nowIso = new Date().toISOString();

      const remoteJobs: Job[] = rawJobs.map((job) => ({
        ...job,
        syncStatus: 'SYNCED' as JobSyncStatus,
        lastSyncedAt: nowIso,
      }));

      await indexedDBClient.init();

      // Perform reconciliation if we have jobs
      if (remoteJobs.length > 0) {
        // Extract technicianId from the first job (all jobs are for the same technician)
        const technicianId = remoteJobs[0].technicianId;
        
        if (technicianId) {
          // Get existing jobs from IndexedDB for this technician and date
          const existingJobs = await this.getCachedSchedule(technicianId, date);
          
          // Create sets for efficient lookup
          const remoteJobIds = new Set(remoteJobs.map((job) => job.id));
          const existingJobIds = new Set(existingJobs.map((job: any) => job.id));
          
          // Update/add remote jobs to IndexedDB
          await indexedDBClient.putAll('jobs', remoteJobs);
          
          // Delete jobs from IndexedDB that are no longer on the server
          // (jobs that exist locally but not in remote set, for this date range)
          const jobsToDelete = existingJobs.filter(
            (job: any) => !remoteJobIds.has(job.id)
          );
          
          for (const job of jobsToDelete) {
            // Only delete if the job's scheduledAt is within the date range
            if (job.scheduledAt) {
              const scheduledDate = new Date(job.scheduledAt);
              const start = startOfDay(date);
              const end = endOfDay(date);
              
              if (scheduledDate >= start && scheduledDate <= end) {
                await indexedDBClient.delete('jobs', job.id);
              }
            }
          }
        } else {
          // Fallback: if no technicianId, just update/add jobs
          await indexedDBClient.putAll('jobs', remoteJobs);
        }

        // Update sync metadata
        await this.updateSyncMetadata({
          key: `technician_schedule_lastSync_${today}`,
          value: {
            date: today,
            jobCount: remoteJobs.length,
          },
          updatedAt: Date.now(),
        });
      } else {
        // No remote jobs - delete all jobs for this date if we have technicianId
        // Note: Without technicianId, we can't safely delete, so we skip deletion
        // The next sync when jobs exist will reconcile properly
        await this.updateSyncMetadata({
          key: `technician_schedule_lastSync_${today}`,
          value: {
            date: today,
            jobCount: 0,
          },
          updatedAt: Date.now(),
        });
      }
    } catch (error) {
      console.error('Failed to sync technician schedule:', error);
      throw error;
    }
  }

  /**
   * Get cached schedule from IndexedDB
   */
  async getCachedSchedule(
    technicianId: string,
    date: Date = new Date()
  ): Promise<any[]> {
    await indexedDBClient.init();

    // Get all jobs for technician using IDBKeyRange
    const allJobs = await indexedDBClient.query(
      'jobs',
      'technicianId',
      IDBKeyRange.only(technicianId)
    );

    // Filter by date
    const start = startOfDay(date);
    const end = endOfDay(date);

    return allJobs.filter((job: any) => {
      if (!job.scheduledAt) return false;
      const scheduledDate = new Date(job.scheduledAt);
      return scheduledDate >= start && scheduledDate <= end;
    });
  }

  /**
   * Sync entities with date-based filtering
   */
  async syncByDateRange(
    entityType: 'Job' | 'Technician' | 'Customer' | 'Invoice',
    startDate: Date,
    endDate: Date,
    filters?: Omit<SyncFilters, 'date'>
  ): Promise<void> {
    const start = format(startDate, 'yyyy-MM-dd');
    const end = format(endDate, 'yyyy-MM-dd');

    try {
      const endpoint = `/${entityType.toLowerCase()}s/sync?startDate=${start}&endDate=${end}`;
      const response = await apiClient.get(endpoint, { skipCache: true });

      const entities = Array.isArray(response.data) ? response.data : [response.data];
      const storeName = entityType.toLowerCase() + 's';

      if (entities.length > 0) {
        await indexedDBClient.init();
        await indexedDBClient.putAll(storeName, entities);

        // Update sync metadata
        await this.updateSyncMetadata({
          key: `${entityType.toLowerCase()}_sync_${start}_${end}`,
          value: {
            entityType,
            startDate: start,
            endDate: end,
            count: entities.length,
          },
          updatedAt: Date.now(),
        });
      }
    } catch (error) {
      console.error(`Failed to sync ${entityType} by date range:`, error);
      throw error;
    }
  }

  /**
   * Incremental sync - only sync changes since last sync
   */
  async incrementalSync(
    entityType: 'Job' | 'Technician' | 'Customer' | 'Invoice',
    lastSyncTimestamp?: number
  ): Promise<void> {
    const timestamp = lastSyncTimestamp || (await this.getLastSyncTimestamp(entityType));

    try {
      const endpoint = `/${entityType.toLowerCase()}s/sync?since=${timestamp}`;
      const response = await apiClient.get(endpoint, { skipCache: true });

      const entities = Array.isArray(response.data) ? response.data : [response.data];
      const storeName = entityType.toLowerCase() + 's';

      if (entities.length > 0) {
        await indexedDBClient.init();
        
        // Update or insert entities
        for (const entity of entities) {
          await indexedDBClient.put(storeName, entity);
        }

        // Update sync metadata
        await this.updateSyncMetadata({
          key: `${entityType.toLowerCase()}_lastSync`,
          value: {
            entityType,
            timestamp: Date.now(),
            count: entities.length,
          },
          updatedAt: Date.now(),
        });
      }
    } catch (error) {
      console.error(`Failed to incremental sync ${entityType}:`, error);
      throw error;
    }
  }

  /**
   * Get last sync timestamp for an entity type
   */
  async getLastSyncTimestamp(
    entityType: 'Job' | 'Technician' | 'Customer' | 'Invoice'
  ): Promise<number> {
    await indexedDBClient.init();
    const metadata = await indexedDBClient.get<SyncMetadata>(
      'syncMetadata',
      `${entityType.toLowerCase()}_lastSync`
    );

    return metadata?.value?.timestamp || 0;
  }

  /**
   * Update sync metadata
   */
  private async updateSyncMetadata(metadata: SyncMetadata): Promise<void> {
    await indexedDBClient.init();
    await indexedDBClient.put('syncMetadata', metadata);
  }

  /**
   * Clear cached data for a specific date range
   */
  async clearCache(
    entityType: 'Job' | 'Technician' | 'Customer' | 'Invoice',
    startDate?: Date,
    endDate?: Date
  ): Promise<void> {
    await indexedDBClient.init();
    const storeName = entityType.toLowerCase() + 's';

    if (!startDate || !endDate) {
      // Clear all cached data for this entity type
      const allEntities = await indexedDBClient.getAll(storeName);
      for (const entity of allEntities) {
        await indexedDBClient.delete(storeName, (entity as any).id);
      }
    } else {
      // Clear only entities in date range
      const allEntities = await indexedDBClient.getAll(storeName);
      const start = startOfDay(startDate);
      const end = endOfDay(endDate);

      for (const entity of allEntities) {
        const entityDate = (entity as any).scheduledAt || (entity as any).createdAt;
        if (entityDate) {
          const date = new Date(entityDate);
          if (date >= start && date <= end) {
            await indexedDBClient.delete(storeName, (entity as any).id);
          }
        }
      }
    }
  }

  /**
   * Get sync status for an entity type
   */
  async getSyncStatus(
    entityType: 'Job' | 'Technician' | 'Customer' | 'Invoice'
  ): Promise<{
    lastSyncedAt: number | null;
    cachedCount: number;
    isStale: boolean;
  }> {
    await indexedDBClient.init();
    
    const metadata = await indexedDBClient.get<SyncMetadata>(
      'syncMetadata',
      `${entityType.toLowerCase()}_lastSync`
    );

    const storeName = entityType.toLowerCase() + 's';
    const cachedEntities = await indexedDBClient.getAll(storeName);

    const lastSyncedAt = metadata?.updatedAt || null;
    const isStale = lastSyncedAt
      ? Date.now() - lastSyncedAt > 24 * 60 * 60 * 1000 // 24 hours
      : true;

    return {
      lastSyncedAt,
      cachedCount: cachedEntities.length,
      isStale,
    };
  }
}

// Singleton instance
export const syncEngine = new SyncEngine();

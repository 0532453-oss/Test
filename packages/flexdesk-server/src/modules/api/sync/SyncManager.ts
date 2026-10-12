/**
 * SyncManager - Orchestrates offline-first sync operations
 * 
 * Manages a queue of operations to sync when online.
 * Integrates with IndexedDBClient for persistence.
 */

import { indexedDBClient } from '@/modules/api/storage/IndexedDBClient';
import {
  type SyncOperation,
  SyncOperationStatus,
  SyncOperationType,
} from '@/modules/api/sync/types/SyncOperation';

export interface SyncStatus {
  isOnline: boolean;
  pendingOperations: number;
  syncingOperations: number;
  failedOperations: number;
}

export class SyncManager {
  private syncInProgress = false;
  private onlineListeners: Array<() => void> = [];

  constructor() {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.processQueue());
      window.addEventListener('offline', () => {
        // Update sync status if needed
      });
    }
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    if (typeof navigator === 'undefined') {
      return true; // Assume online for SSR
    }
    return navigator.onLine;
  }

  /**
   * Queue an operation for sync
   */
  async queueOperation(
    operation: Omit<
      SyncOperation,
      'id' | 'status' | 'retryCount' | 'createdAt' | 'updatedAt'
    >
  ): Promise<void> {
    const syncOperation: SyncOperation = {
      ...operation,
      id: `${operation.entityType}_${operation.entityId}_${Date.now()}`,
      status: SyncOperationStatus.PENDING,
      retryCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await indexedDBClient.init();
    await indexedDBClient.put('syncQueue', syncOperation);

    // If online, try to sync immediately
    if (this.isOnline()) {
      this.processQueue();
    }
  }

  /**
   * Get all pending operations
   */
  async getPendingOperations(): Promise<SyncOperation[]> {
    await indexedDBClient.init();
    const allOperations = await indexedDBClient.getAll<SyncOperation>('syncQueue');
    return allOperations.filter(
      (op) => op.status === SyncOperationStatus.PENDING
    );
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    await indexedDBClient.init();
    const allOperations = await indexedDBClient.getAll<SyncOperation>('syncQueue');

    return {
      isOnline: this.isOnline(),
      pendingOperations: allOperations.filter(
        (op) => op.status === SyncOperationStatus.PENDING
      ).length,
      syncingOperations: allOperations.filter(
        (op) => op.status === SyncOperationStatus.SYNCING
      ).length,
      failedOperations: allOperations.filter(
        (op) => op.status === SyncOperationStatus.FAILED
      ).length,
    };
  }

  /**
   * Process the sync queue
   */
  async processQueue(): Promise<void> {
    if (!this.isOnline() || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;

    try {
      const pendingOps = await this.getPendingOperations();

      for (const operation of pendingOps) {
        await this.syncOperation(operation);
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync a single operation
   */
  private async syncOperation(operation: SyncOperation): Promise<void> {
    // Mark as syncing
    operation.status = SyncOperationStatus.SYNCING;
    operation.updatedAt = Date.now();
    await indexedDBClient.put('syncQueue', operation);

    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';
      const url = operation.endpoint.startsWith('http')
        ? operation.endpoint
        : `${baseURL}${operation.endpoint}`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add auth token and workspace ID if available
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const workspaceId = localStorage.getItem('workspace_id');
        if (workspaceId) {
          headers['X-Workspace-Id'] = workspaceId;
        }
      }

      let response: Response;
      switch (operation.method) {
        case 'POST':
        case 'PUT':
          response = await fetch(url, {
            method: operation.method,
            headers,
            body: JSON.stringify(operation.data),
          });
          break;
        case 'PATCH':
          response = await fetch(url, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(operation.data),
          });
          break;
        case 'DELETE':
          response = await fetch(url, {
            method: 'DELETE',
            headers,
          });
          break;
        default:
          throw new Error(`Unsupported method: ${operation.method}`);
      }

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      const data = await response.json().catch(() => ({}));

      // Mark as completed and remove from queue
      await indexedDBClient.delete('syncQueue', operation.id);

      // Update cached record if needed
      if (operation.type !== SyncOperationType.DELETE && data) {
        await this.updateCachedRecord(operation.entityType, data);
      } else if (operation.type === SyncOperationType.DELETE) {
        await this.removeCachedRecord(operation.entityType, operation.entityId);
      }
    } catch (error) {
      // Mark as failed
      operation.status = SyncOperationStatus.FAILED;
      operation.retryCount += 1;
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      operation.updatedAt = Date.now();

      // Remove from queue if retry limit exceeded
      if (operation.retryCount >= 3) {
        await indexedDBClient.delete('syncQueue', operation.id);
      } else {
        await indexedDBClient.put('syncQueue', operation);
      }

      throw error;
    }
  }

  /**
   * Update cached record after successful sync
   */
  private async updateCachedRecord(entityType: string, data: any): Promise<void> {
    const storeName = entityType.toLowerCase() + 's'; // jobs, technicians, etc.
    
    if (['jobs', 'technicians', 'customers', 'invoices'].includes(storeName)) {
      await indexedDBClient.put(storeName, data);
    }
  }

  /**
   * Remove cached record after successful delete
   */
  private async removeCachedRecord(
    entityType: string,
    entityId: string
  ): Promise<void> {
    const storeName = entityType.toLowerCase() + 's';
    
    if (['jobs', 'technicians', 'customers', 'invoices'].includes(storeName)) {
      await indexedDBClient.delete(storeName, entityId);
    }
  }

  /**
   * Register a listener for online events
   */
  onOnline(callback: () => void): void {
    this.onlineListeners.push(callback);
  }

  /**
   * Clear all failed operations
   */
  async clearFailedOperations(): Promise<void> {
    await indexedDBClient.init();
    const allOperations = await indexedDBClient.getAll<SyncOperation>('syncQueue');
    const failedOps = allOperations.filter(
      (op) => op.status === SyncOperationStatus.FAILED
    );

    for (const op of failedOps) {
      await indexedDBClient.delete('syncQueue', op.id);
    }
  }
}

// Singleton instance
export const syncManager = new SyncManager();


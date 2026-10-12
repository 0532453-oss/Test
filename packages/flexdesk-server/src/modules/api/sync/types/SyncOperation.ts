/**
 * Sync Operation Types
 * 
 * Defines the structure of operations queued for sync
 */

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

export interface SyncOperation {
  id: string;
  type: SyncOperationType;
  entityType: string; // 'Job', 'Technician', 'Customer', etc.
  entityId: string;
  data?: any; // The data to sync (for CREATE/UPDATE)
  endpoint: string; // REST endpoint to call
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  status: SyncOperationStatus;
  retryCount: number;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SyncMetadata {
  key: string;
  value: any;
  updatedAt: number;
}


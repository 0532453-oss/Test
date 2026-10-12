import { type SyncOperation } from '@/modules/api/sync/types/SyncOperation';
export interface SyncStatus {
    isOnline: boolean;
    pendingOperations: number;
    syncingOperations: number;
    failedOperations: number;
}
export declare class SyncManager {
    private syncInProgress;
    private onlineListeners;
    constructor();
    isOnline(): boolean;
    queueOperation(operation: Omit<SyncOperation, 'id' | 'status' | 'retryCount' | 'createdAt' | 'updatedAt'>): Promise<void>;
    getPendingOperations(): Promise<SyncOperation[]>;
    getSyncStatus(): Promise<SyncStatus>;
    processQueue(): Promise<void>;
    private syncOperation;
    private updateCachedRecord;
    private removeCachedRecord;
    onOnline(callback: () => void): void;
    clearFailedOperations(): Promise<void>;
}
export declare const syncManager: SyncManager;

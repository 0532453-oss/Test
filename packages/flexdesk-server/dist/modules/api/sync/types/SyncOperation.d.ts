export declare enum SyncOperationType {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE"
}
export declare enum SyncOperationStatus {
    PENDING = "PENDING",
    SYNCING = "SYNCING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export interface SyncOperation {
    id: string;
    type: SyncOperationType;
    entityType: string;
    entityId: string;
    data?: any;
    endpoint: string;
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

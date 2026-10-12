export type BaseObjectRecord = {
    id: string;
    workspaceId: string;
    syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'CONFLICT' | 'FAILED';
    syncVersion: number;
    lastSyncedAt?: string | null;
    createdAt: string;
    updatedAt: string;
};

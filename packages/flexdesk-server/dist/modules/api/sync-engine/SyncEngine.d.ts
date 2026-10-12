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
export declare enum SyncStrategy {
    INCREMENTAL = "INCREMENTAL",
    FULL = "FULL",
    DATE_RANGE = "DATE_RANGE"
}
export declare class SyncEngine {
    syncTechnicianSchedule(date?: Date): Promise<void>;
    getCachedSchedule(technicianId: string, date?: Date): Promise<any[]>;
    syncByDateRange(entityType: 'Job' | 'Technician' | 'Customer' | 'Invoice', startDate: Date, endDate: Date, filters?: Omit<SyncFilters, 'date'>): Promise<void>;
    incrementalSync(entityType: 'Job' | 'Technician' | 'Customer' | 'Invoice', lastSyncTimestamp?: number): Promise<void>;
    getLastSyncTimestamp(entityType: 'Job' | 'Technician' | 'Customer' | 'Invoice'): Promise<number>;
    private updateSyncMetadata;
    clearCache(entityType: 'Job' | 'Technician' | 'Customer' | 'Invoice', startDate?: Date, endDate?: Date): Promise<void>;
    getSyncStatus(entityType: 'Job' | 'Technician' | 'Customer' | 'Invoice'): Promise<{
        lastSyncedAt: number | null;
        cachedCount: number;
        isStale: boolean;
    }>;
}
export declare const syncEngine: SyncEngine;

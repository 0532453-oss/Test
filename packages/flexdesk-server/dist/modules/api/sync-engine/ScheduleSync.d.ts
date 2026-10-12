export interface ScheduleSyncOptions {
    technicianId: string;
    date?: Date;
    forceRefresh?: boolean;
}
export declare class ScheduleSync {
    syncCurrentDaySchedule(options: ScheduleSyncOptions): Promise<any[]>;
    syncDateRange(technicianId: string, startDate: Date, endDate: Date): Promise<void>;
    getSchedule(technicianId: string, date?: Date): Promise<any[]>;
}
export declare const scheduleSync: ScheduleSync;

export interface DateRangeFilter {
    startDate: Date;
    endDate: Date;
}
export interface SyncScope {
    entityType: 'Job' | 'Technician' | 'Customer' | 'Invoice';
    filters?: {
        workspaceId?: string;
        technicianId?: string;
        status?: string;
        dateRange?: DateRangeFilter;
    };
}
export declare class SyncFilters {
    static buildQueryParams(scope: SyncScope): Record<string, string>;
    static currentDay(): DateRangeFilter;
    static currentWeek(): DateRangeFilter;
    static currentMonth(): DateRangeFilter;
    static nextDays(days: number): DateRangeFilter;
}

import { type SyncScope } from './SyncFilters';
export declare enum SyncStrategyType {
    INCREMENTAL = "INCREMENTAL",
    FULL = "FULL",
    DATE_RANGE = "DATE_RANGE",
    CURRENT_DAY_ONLY = "CURRENT_DAY_ONLY"
}
export interface SyncStrategyConfig {
    type: SyncStrategyType;
    entityType: 'Job' | 'Technician' | 'Customer' | 'Invoice';
    filters?: SyncScope['filters'];
}
export declare class SyncStrategy {
    static execute(config: SyncStrategyConfig): Promise<void>;
    private static incrementalSync;
    private static fullSync;
    private static dateRangeSync;
    private static currentDaySync;
}

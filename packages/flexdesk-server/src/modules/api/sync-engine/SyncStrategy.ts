/**
 * Sync Strategy - Different sync strategies for different use cases
 */

import { syncEngine } from './SyncEngine';
import { SyncFilters, type SyncScope } from './SyncFilters';

export enum SyncStrategyType {
  INCREMENTAL = 'INCREMENTAL',
  FULL = 'FULL',
  DATE_RANGE = 'DATE_RANGE',
  CURRENT_DAY_ONLY = 'CURRENT_DAY_ONLY',
}

export interface SyncStrategyConfig {
  type: SyncStrategyType;
  entityType: 'Job' | 'Technician' | 'Customer' | 'Invoice';
  filters?: SyncScope['filters'];
}

export class SyncStrategy {
  /**
   * Execute sync based on strategy
   */
  static async execute(config: SyncStrategyConfig): Promise<void> {
    switch (config.type) {
      case SyncStrategyType.INCREMENTAL:
        return this.incrementalSync(config);
      
      case SyncStrategyType.FULL:
        return this.fullSync(config);
      
      case SyncStrategyType.DATE_RANGE:
        return this.dateRangeSync(config);
      
      case SyncStrategyType.CURRENT_DAY_ONLY:
        return this.currentDaySync(config);
      
      default:
        throw new Error(`Unknown sync strategy: ${config.type}`);
    }
  }

  /**
   * Incremental sync - only changes since last sync
   */
  private static async incrementalSync(config: SyncStrategyConfig): Promise<void> {
    await syncEngine.incrementalSync(config.entityType);
  }

  /**
   * Full sync - sync all records (use with caution)
   */
  private static async fullSync(config: SyncStrategyConfig): Promise<void> {
    // For full sync, we sync a large date range
    const dateRange = SyncFilters.currentMonth();
    await syncEngine.syncByDateRange(
      config.entityType,
      dateRange.startDate,
      dateRange.endDate
    );
  }

  /**
   * Date range sync
   */
  private static async dateRangeSync(config: SyncStrategyConfig): Promise<void> {
    if (!config.filters?.dateRange) {
      throw new Error('Date range required for DATE_RANGE sync strategy');
    }

    await syncEngine.syncByDateRange(
      config.entityType,
      config.filters.dateRange.startDate,
      config.filters.dateRange.endDate
    );
  }

  /**
   * Current day only sync (optimized for mobile)
   */
  private static async currentDaySync(config: SyncStrategyConfig): Promise<void> {
    if (config.entityType !== 'Job') {
      throw new Error('CURRENT_DAY_ONLY strategy only supports Job entity type');
    }

    if (!config.filters?.technicianId) {
      throw new Error('Technician ID required for CURRENT_DAY_ONLY sync');
    }

    const { scheduleSync } = await import('./ScheduleSync');
    await scheduleSync.syncCurrentDaySchedule({
      technicianId: config.filters.technicianId,
    });
  }
}

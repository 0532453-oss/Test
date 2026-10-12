"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncStrategy = exports.SyncStrategyType = void 0;
const SyncEngine_1 = require("./SyncEngine");
const SyncFilters_1 = require("./SyncFilters");
var SyncStrategyType;
(function (SyncStrategyType) {
    SyncStrategyType["INCREMENTAL"] = "INCREMENTAL";
    SyncStrategyType["FULL"] = "FULL";
    SyncStrategyType["DATE_RANGE"] = "DATE_RANGE";
    SyncStrategyType["CURRENT_DAY_ONLY"] = "CURRENT_DAY_ONLY";
})(SyncStrategyType || (exports.SyncStrategyType = SyncStrategyType = {}));
class SyncStrategy {
    static async execute(config) {
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
    static async incrementalSync(config) {
        await SyncEngine_1.syncEngine.incrementalSync(config.entityType);
    }
    static async fullSync(config) {
        const dateRange = SyncFilters_1.SyncFilters.currentMonth();
        await SyncEngine_1.syncEngine.syncByDateRange(config.entityType, dateRange.startDate, dateRange.endDate);
    }
    static async dateRangeSync(config) {
        if (!config.filters?.dateRange) {
            throw new Error('Date range required for DATE_RANGE sync strategy');
        }
        await SyncEngine_1.syncEngine.syncByDateRange(config.entityType, config.filters.dateRange.startDate, config.filters.dateRange.endDate);
    }
    static async currentDaySync(config) {
        if (config.entityType !== 'Job') {
            throw new Error('CURRENT_DAY_ONLY strategy only supports Job entity type');
        }
        if (!config.filters?.technicianId) {
            throw new Error('Technician ID required for CURRENT_DAY_ONLY sync');
        }
        const { scheduleSync } = await Promise.resolve().then(() => require('./ScheduleSync'));
        await scheduleSync.syncCurrentDaySchedule({
            technicianId: config.filters.technicianId,
        });
    }
}
exports.SyncStrategy = SyncStrategy;

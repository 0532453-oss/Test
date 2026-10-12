"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleSync = exports.ScheduleSync = void 0;
const SyncEngine_1 = require("./SyncEngine");
function format(date, formatStr) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    if (formatStr === 'yyyy-MM-dd')
        return `${year}-${month}-${day}`;
    return `${year}-${month}-${day}`;
}
function isSameDay(date1, date2) {
    return (date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate());
}
class ScheduleSync {
    async syncCurrentDaySchedule(options) {
        const { technicianId, date = new Date(), forceRefresh = false } = options;
        if (!forceRefresh) {
            const cached = await SyncEngine_1.syncEngine.getCachedSchedule(technicianId, date);
            if (cached.length > 0) {
                const firstScheduledAt = cached[0].scheduledAt
                    ? new Date(cached[0].scheduledAt)
                    : null;
                if (firstScheduledAt && isSameDay(firstScheduledAt, date)) {
                    return cached;
                }
            }
        }
        await SyncEngine_1.syncEngine.syncTechnicianSchedule(date);
        return SyncEngine_1.syncEngine.getCachedSchedule(technicianId, date);
    }
    async syncDateRange(technicianId, startDate, endDate) {
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            await SyncEngine_1.syncEngine.syncTechnicianSchedule(currentDate);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }
    async getSchedule(technicianId, date = new Date()) {
        const cached = await SyncEngine_1.syncEngine.getCachedSchedule(technicianId, date);
        if (cached.length > 0) {
            return cached;
        }
        await SyncEngine_1.syncEngine.syncTechnicianSchedule(date);
        return SyncEngine_1.syncEngine.getCachedSchedule(technicianId, date);
    }
}
exports.ScheduleSync = ScheduleSync;
exports.scheduleSync = new ScheduleSync();

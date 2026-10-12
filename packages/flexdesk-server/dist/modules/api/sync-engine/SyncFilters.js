"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncFilters = void 0;
function format(date, formatStr) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    if (formatStr === 'yyyy-MM-dd')
        return `${year}-${month}-${day}`;
    return `${year}-${month}-${day}`;
}
function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}
function endOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}
class SyncFilters {
    static buildQueryParams(scope) {
        const params = {};
        if (scope.filters?.workspaceId) {
            params.workspaceId = scope.filters.workspaceId;
        }
        if (scope.filters?.technicianId) {
            params.technicianId = scope.filters.technicianId;
        }
        if (scope.filters?.status) {
            params.status = scope.filters.status;
        }
        if (scope.filters?.dateRange) {
            params.startDate = format(scope.filters.dateRange.startDate, 'yyyy-MM-dd');
            params.endDate = format(scope.filters.dateRange.endDate, 'yyyy-MM-dd');
        }
        return params;
    }
    static currentDay() {
        const today = new Date();
        return {
            startDate: startOfDay(today),
            endDate: endOfDay(today),
        };
    }
    static currentWeek() {
        const today = new Date();
        const startOfWeek = startOfDay(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = endOfDay(today);
        endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
        return {
            startDate: startOfWeek,
            endDate: endOfWeek,
        };
    }
    static currentMonth() {
        const today = new Date();
        return {
            startDate: startOfDay(new Date(today.getFullYear(), today.getMonth(), 1)),
            endDate: endOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
        };
    }
    static nextDays(days) {
        const today = new Date();
        return {
            startDate: startOfDay(today),
            endDate: endOfDay(new Date(today.getTime() + days * 24 * 60 * 60 * 1000)),
        };
    }
}
exports.SyncFilters = SyncFilters;

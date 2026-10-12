"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeJobDuration = computeJobDuration;
exports.formatJobDuration = formatJobDuration;
function computeJobDuration(startDate, endDate) {
    if (!startDate || !endDate) {
        return null;
    }
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return null;
    }
    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / (1000 * 60));
}
function formatJobDuration(minutes) {
    if (minutes === null) {
        return 'N/A';
    }
    if (minutes < 60) {
        return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JOB_STATUS_TRANSITIONS = void 0;
exports.isValidTransition = isValidTransition;
exports.requiresGeofence = requiresGeofence;
exports.getValidTransitions = getValidTransitions;
exports.isTerminalStatus = isTerminalStatus;
exports.getNextStatuses = getNextStatuses;
exports.JOB_STATUS_TRANSITIONS = {
    SCHEDULED: ['DISPATCHED', 'CANCELLED'],
    DISPATCHED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'ON_HOLD', 'CANCELLED'],
    ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
};
function isValidTransition(from, to) {
    const allowedTransitions = exports.JOB_STATUS_TRANSITIONS[from];
    return allowedTransitions.includes(to);
}
function requiresGeofence(from, to) {
    return from === 'DISPATCHED' && to === 'IN_PROGRESS';
}
function getValidTransitions(from) {
    return exports.JOB_STATUS_TRANSITIONS[from] || [];
}
function isTerminalStatus(status) {
    return exports.JOB_STATUS_TRANSITIONS[status].length === 0;
}
function getNextStatuses(currentStatus) {
    return getValidTransitions(currentStatus).map((status) => ({
        status,
        requiresGeofence: requiresGeofence(currentStatus, status),
    }));
}

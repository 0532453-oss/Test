"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateJobTransition = validateJobTransition;
const jobStatusMachine_1 = require("./jobStatusMachine");
function validateJobTransition(from, to) {
    if (!(0, jobStatusMachine_1.isValidTransition)(from, to)) {
        return {
            valid: false,
            requiresGeofence: false,
            error: `Invalid transition from ${from} to ${to}`,
        };
    }
    return {
        valid: true,
        requiresGeofence: (0, jobStatusMachine_1.requiresGeofence)(from, to),
    };
}

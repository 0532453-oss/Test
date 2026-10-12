"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeofenceError = void 0;
exports.calculateDistance = calculateDistance;
exports.validateJobGeofence = validateJobGeofence;
exports.isValidLocation = isValidLocation;
function calculateDistance(point1, point2) {
    const R = 6371000;
    const dLat = toRadians(point2.lat - point1.lat);
    const dLng = toRadians(point2.lng - point1.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(point1.lat)) *
            Math.cos(toRadians(point2.lat)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance);
}
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
async function validateJobGeofence(jobLocation, technicianLocation, radiusMeters = 500) {
    if (!jobLocation.lat || !jobLocation.lng) {
        return {
            valid: false,
            distance: 0,
            message: 'Job location not set',
        };
    }
    if (!technicianLocation.lat || !technicianLocation.lng) {
        return {
            valid: false,
            distance: 0,
            message: 'Technician location not available',
        };
    }
    const distance = calculateDistance(jobLocation, technicianLocation);
    const valid = distance <= radiusMeters;
    return {
        valid,
        distance,
        message: valid
            ? undefined
            : `You must be within ${radiusMeters}m of the job location. Current distance: ${distance}m`,
    };
}
function isValidLocation(location) {
    if (!location)
        return false;
    return (typeof location.lat === 'number' &&
        typeof location.lng === 'number' &&
        !isNaN(location.lat) &&
        !isNaN(location.lng) &&
        location.lat >= -90 &&
        location.lat <= 90 &&
        location.lng >= -180 &&
        location.lng <= 180);
}
class GeofenceError extends Error {
    constructor(distance, requiredRadius = 500, message) {
        super(message ||
            `Geofence validation failed: You are ${distance}m away, but must be within ${requiredRadius}m`);
        this.distance = distance;
        this.requiredRadius = requiredRadius;
        this.name = 'GeofenceError';
    }
}
exports.GeofenceError = GeofenceError;

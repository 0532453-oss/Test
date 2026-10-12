export interface Location {
    lat: number;
    lng: number;
}
export interface GeofenceValidationResult {
    valid: boolean;
    distance: number;
    message?: string;
}
export declare function calculateDistance(point1: Location, point2: Location): number;
export declare function validateJobGeofence(jobLocation: Location, technicianLocation: Location, radiusMeters?: number): Promise<GeofenceValidationResult>;
export declare function isValidLocation(location: Location | null | undefined): boolean;
export declare class GeofenceError extends Error {
    distance: number;
    requiredRadius: number;
    constructor(distance: number, requiredRadius?: number, message?: string);
}

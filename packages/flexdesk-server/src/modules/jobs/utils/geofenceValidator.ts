/**
 * Geofence Validator - GPS geofencing logic (500m radius)
 * 
 * Validates that a technician is within 500 meters of a job location
 * before allowing status transitions.
 */

export interface Location {
  lat: number;
  lng: number;
}

export interface GeofenceValidationResult {
  valid: boolean;
  distance: number; // Distance in meters
  message?: string;
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  point1: Location,
  point2: Location
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
      Math.cos(toRadians(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Validate that technician is within geofence (500m radius)
 */
export async function validateJobGeofence(
  jobLocation: Location,
  technicianLocation: Location,
  radiusMeters: number = 500
): Promise<GeofenceValidationResult> {
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

/**
 * Check if location is valid
 */
export function isValidLocation(location: Location | null | undefined): boolean {
  if (!location) return false;
  return (
    typeof location.lat === 'number' &&
    typeof location.lng === 'number' &&
    !isNaN(location.lat) &&
    !isNaN(location.lng) &&
    location.lat >= -90 &&
    location.lat <= 90 &&
    location.lng >= -180 &&
    location.lng <= 180
  );
}

/**
 * Custom error for geofence validation failures
 */
export class GeofenceError extends Error {
  constructor(
    public distance: number,
    public requiredRadius: number = 500,
    message?: string
  ) {
    super(
      message ||
        `Geofence validation failed: You are ${distance}m away, but must be within ${requiredRadius}m`
    );
    this.name = 'GeofenceError';
  }
}

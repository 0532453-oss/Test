/**
 * Geofence utilities for job site validation.
 *
 * Uses haversine formula to calculate distance between two GPS coordinates.
 */

/** Radius of the Earth in meters. */
const EARTH_RADIUS_M = 6_371_000;

/** Maximum distance (meters) to allow "Start Job" action. */
export const GEOFENCE_RADIUS_M = 500;

/** Convert degrees to radians. */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate the haversine distance between two lat/lng points.
 * @returns Distance in meters.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

export interface GeofenceResult {
  withinRange: boolean;
  distanceM: number;
}

/**
 * Check whether the technician is within the geofence radius of the job site.
 */
export function checkGeofence(
  techLat: number,
  techLng: number,
  jobLat: number,
  jobLng: number,
): GeofenceResult {
  const distanceM = haversineDistance(techLat, techLng, jobLat, jobLng);
  return {
    withinRange: distanceM <= GEOFENCE_RADIUS_M,
    distanceM: Math.round(distanceM),
  };
}

import { describe, it, expect } from 'vitest';
import {
  calculateDistance,
  validateJobGeofence,
  isValidLocation,
  type Location,
} from './geofenceValidator';

describe('calculateDistance', () => {
  it('returns 0 for the same point', () => {
    const point: Location = { lat: 40.7128, lng: -74.006 };
    expect(calculateDistance(point, point)).toBe(0);
  });

  it('calculates distance between two known points', () => {
    // New York to Los Angeles ~ 3,944 km
    const nyc: Location = { lat: 40.7128, lng: -74.006 };
    const la: Location = { lat: 34.0522, lng: -118.2437 };
    const distance = calculateDistance(nyc, la);

    // Should be approximately 3,944 km (3,944,000 m), allow 5% tolerance
    expect(distance).toBeGreaterThan(3_900_000);
    expect(distance).toBeLessThan(4_000_000);
  });

  it('calculates short distances accurately', () => {
    // Two points about 100m apart (approximate)
    const point1: Location = { lat: 40.7128, lng: -74.006 };
    const point2: Location = { lat: 40.7137, lng: -74.006 };
    const distance = calculateDistance(point1, point2);

    // ~100m, allow reasonable tolerance
    expect(distance).toBeGreaterThan(50);
    expect(distance).toBeLessThan(200);
  });

  it('returns rounded integer meters', () => {
    const point1: Location = { lat: 40.7128, lng: -74.006 };
    const point2: Location = { lat: 40.713, lng: -74.0062 };
    const distance = calculateDistance(point1, point2);

    expect(Number.isInteger(distance)).toBe(true);
  });
});

describe('validateJobGeofence', () => {
  it('returns valid when within 500m radius', async () => {
    const jobLoc: Location = { lat: 40.7128, lng: -74.006 };
    const techLoc: Location = { lat: 40.7131, lng: -74.006 }; // ~33m away
    const result = await validateJobGeofence(jobLoc, techLoc);

    expect(result.valid).toBe(true);
    expect(result.distance).toBeLessThanOrEqual(500);
    expect(result.message).toBeUndefined();
  });

  it('returns invalid when outside 500m radius', async () => {
    const jobLoc: Location = { lat: 40.7128, lng: -74.006 };
    const techLoc: Location = { lat: 40.72, lng: -74.006 }; // ~800m away
    const result = await validateJobGeofence(jobLoc, techLoc);

    expect(result.valid).toBe(false);
    expect(result.distance).toBeGreaterThan(500);
    expect(result.message).toContain('within 500m');
  });

  it('respects custom radius', async () => {
    const jobLoc: Location = { lat: 40.7128, lng: -74.006 };
    const techLoc: Location = { lat: 40.72, lng: -74.006 }; // ~800m away
    const result = await validateJobGeofence(jobLoc, techLoc, 1000);

    expect(result.valid).toBe(true);
    expect(result.distance).toBeLessThanOrEqual(1000);
  });

  it('returns invalid with message when job lat is 0', async () => {
    const jobLoc: Location = { lat: 0, lng: -74.006 };
    const techLoc: Location = { lat: 40.7128, lng: -74.006 };
    const result = await validateJobGeofence(jobLoc, techLoc);

    expect(result.valid).toBe(false);
    expect(result.message).toBe('Job location not set');
  });

  it('returns invalid with message when technician lat is 0', async () => {
    const jobLoc: Location = { lat: 40.7128, lng: -74.006 };
    const techLoc: Location = { lat: 0, lng: -74.006 };
    const result = await validateJobGeofence(jobLoc, techLoc);

    expect(result.valid).toBe(false);
    expect(result.message).toBe('Technician location not available');
  });
});

describe('isValidLocation', () => {
  it('returns true for valid coordinates', () => {
    expect(isValidLocation({ lat: 40.7128, lng: -74.006 })).toBe(true);
  });

  it('returns true for boundary coordinates', () => {
    expect(isValidLocation({ lat: 90, lng: 180 })).toBe(true);
    expect(isValidLocation({ lat: -90, lng: -180 })).toBe(true);
    expect(isValidLocation({ lat: 0, lng: 0 })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidLocation(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isValidLocation(undefined)).toBe(false);
  });

  it('returns false for out-of-range latitude', () => {
    expect(isValidLocation({ lat: 91, lng: 0 })).toBe(false);
    expect(isValidLocation({ lat: -91, lng: 0 })).toBe(false);
  });

  it('returns false for out-of-range longitude', () => {
    expect(isValidLocation({ lat: 0, lng: 181 })).toBe(false);
    expect(isValidLocation({ lat: 0, lng: -181 })).toBe(false);
  });

  it('returns false for NaN values', () => {
    expect(isValidLocation({ lat: NaN, lng: 0 })).toBe(false);
    expect(isValidLocation({ lat: 0, lng: NaN })).toBe(false);
  });
});

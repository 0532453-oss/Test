/**
 * Technician Location Event
 *
 * Tracks technician GPS position updates for route optimization,
 * geofence triggers, and ETA calculations.
 */

import { AnalyticsEvent } from '../../providers';

export interface TechnicianLocationEvent {
  technicianId: string;
  workspaceId: string;
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  currentJobId?: string;
  distanceToJobKm?: number;
  recordedAt: Date;
}

export function createTechnicianLocationEvent(data: TechnicianLocationEvent): AnalyticsEvent {
  return {
    name: 'technician.location_update',
    properties: {
      technicianId: data.technicianId,
      lat: data.lat,
      lng: data.lng,
      accuracy: data.accuracy,
      speed: data.speed,
      heading: data.heading,
      currentJobId: data.currentJobId,
      distanceToJobKm: data.distanceToJobKm,
    },
    timestamp: data.recordedAt,
    workspaceId: data.workspaceId,
  };
}

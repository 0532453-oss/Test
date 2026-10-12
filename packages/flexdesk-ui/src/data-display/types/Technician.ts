/**
 * Technician Type Definition for Components
 */

export interface TechnicianLocation {
  lat: number;
  lng: number;
  updatedAt?: string;
}

export interface Technician {
  id: string;
  userId: string;
  phone?: string | null;
  licenseNumber?: string | null;
  specialties: string[];
  currentLocation?: TechnicianLocation | null;
  isAvailable: boolean;
  firstName?: string;
  lastName?: string;
}

export interface NextJobInfo {
  jobId: string;
  customerName: string;
  title: string;
  address?: string;
  lat?: number;
  lng?: number;
  scheduledAt: string;
  travelTimeMinutes?: number;
  travelDistanceMeters?: number;
  minutesUntilStart: number;
  directionsUrl: string;
  hasJobInProgress: boolean;
  inProgressJobId?: string;
}

export interface NoNextJobInfo {
  hasNextJob: false;
  message: string;
  hasJobInProgress: boolean;
  inProgressJobId?: string;
}

export type NextJobResponse = NextJobInfo | NoNextJobInfo;

export function hasNextJob(response: NextJobResponse): response is NextJobInfo {
  return 'jobId' in response;
}

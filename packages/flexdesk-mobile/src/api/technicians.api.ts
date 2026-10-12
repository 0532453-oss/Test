/**
 * Technicians API functions.
 *
 * Endpoints for managing technician profiles, location, availability, and next job.
 */

import apiClient from './client';
import type {
  NextJobResponse,
  Technician,
  UpdateAvailabilityRequest,
  UpdateLocationRequest,
  UpdateTechnicianProfileRequest,
} from './types';

/** Get the current authenticated technician's profile. */
export async function getMe(): Promise<Technician> {
  const { data } = await apiClient.get<Technician>('/technicians/me');
  return data;
}

/** Get a technician by ID. */
export async function getTechnicianById(id: string): Promise<Technician> {
  const { data } = await apiClient.get<Technician>(`/technicians/${id}`);
  return data;
}

/** Update a technician's profile fields. */
export async function updateProfile(
  id: string,
  req: UpdateTechnicianProfileRequest,
): Promise<Technician> {
  const { data } = await apiClient.patch<Technician>(`/technicians/${id}`, req);
  return data;
}

/** Update the technician's current GPS location. */
export async function updateLocation(req: UpdateLocationRequest): Promise<void> {
  await apiClient.patch('/technicians/location', req);
}

/** Update a technician's availability status. */
export async function updateAvailability(
  id: string,
  req: UpdateAvailabilityRequest,
): Promise<Technician> {
  const { data } = await apiClient.patch<Technician>(
    `/technicians/${id}/availability`,
    req,
  );
  return data;
}

/** Get the next upcoming job for a technician. */
export async function getNextJob(id: string): Promise<NextJobResponse> {
  const { data } = await apiClient.get<NextJobResponse>(
    `/technicians/${id}/next-job`,
  );
  return data;
}

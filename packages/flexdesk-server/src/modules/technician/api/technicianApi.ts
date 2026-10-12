/**
 * Technician API - REST API endpoints for technicians
 */

import type { Technician, TechnicianLocation } from '../types/Technician';

import { apiClient } from '@/modules/api/client/apiClient';

export interface NextJobResponse {
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

export interface NoNextJobResponse {
  hasNextJob: false;
  message: string;
  hasJobInProgress: boolean;
  inProgressJobId?: string;
}

export type NextJobResult = NextJobResponse | NoNextJobResponse;

export function hasNextJob(result: NextJobResult): result is NextJobResponse {
  return 'jobId' in result;
}

export const technicianApi = {
  /**
   * Get a single technician
   */
  async getTechnician(technicianId: string): Promise<Technician> {
    const response = await apiClient.get<Technician>(`/api/technicians/${technicianId}`);
    return response.data;
  },

  /**
   * Get multiple technicians
   */
  async getTechnicians(params?: {
    filter?: Record<string, any>;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Technician[]; hasMore: boolean }> {
    const queryParams = new URLSearchParams();
    
    if (params?.filter) {
      queryParams.append('filter', JSON.stringify(params.filter));
    }
    
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    if (params?.offset) {
      queryParams.append('offset', params.offset.toString());
    }

    const response = await apiClient.get<{ data: Technician[]; hasMore: boolean }>(
      `/api/technicians?${queryParams.toString()}`
    );
    
    return response.data;
  },

  /**
   * Update technician location
   */
  async updateLocation(
    technicianId: string,
    location: TechnicianLocation
  ): Promise<Technician> {
    const response = await apiClient.patch<Technician>(
      `/api/technicians/${technicianId}/location`,
      { location }
    );
    return response.data;
  },

  /**
   * Update technician availability
   */
  async updateAvailability(
    technicianId: string,
    isAvailable: boolean
  ): Promise<Technician> {
    const response = await apiClient.patch<Technician>(
      `/api/technicians/${technicianId}`,
      { isAvailable }
    );
    return response.data;
  },

  /**
   * Get next scheduled job for a technician
   * Returns job details with travel time estimation from Google Distance Matrix API
   */
  async getNextJob(technicianId: string): Promise<NextJobResult> {
    const response = await apiClient.get<NextJobResult>(
      `/api/technicians/${technicianId}/next-job`
    );
    return response.data;
  },
};

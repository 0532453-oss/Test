/**
 * Job API - REST API endpoints for jobs
 */

import type { Job } from '../types/Job';
import type { JobStatus } from '../types/JobStatus';

import { apiClient } from '@/modules/api/client/apiClient';

export const jobApi = {
  /**
   * Get a single job
   */
  async getJob(jobId: string): Promise<Job> {
    const response = await apiClient.get<Job>(`/api/jobs/${jobId}`);
    return response.data;
  },

  /**
   * Get multiple jobs with filters
   */
  async getJobs(params?: {
    filter?: Record<string, any>;
    orderBy?: Array<{ field: string; direction: 'asc' | 'desc' }>;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Job[]; hasMore: boolean }> {
    const queryParams = new URLSearchParams();
    
    if (params?.filter) {
      queryParams.append('filter', JSON.stringify(params.filter));
    }
    
    if (params?.orderBy) {
      queryParams.append('orderBy', JSON.stringify(params.orderBy));
    }
    
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    if (params?.offset) {
      queryParams.append('offset', params.offset.toString());
    }

    const response = await apiClient.get<{ data: Job[]; hasMore: boolean }>(
      `/api/jobs?${queryParams.toString()}`
    );
    
    return response.data;
  },

  /**
   * Create a job
   */
  async createJob(data: Partial<Job>): Promise<Job> {
    const response = await apiClient.post<Job>('/api/jobs', data);
    return response.data;
  },

  /**
   * Update a job
   */
  async updateJob(jobId: string, data: Partial<Job>): Promise<Job> {
    const response = await apiClient.patch<Job>(`/api/jobs/${jobId}`, data);
    return response.data;
  },

  /**
   * Update job status (with state machine validation)
   */
  async updateJobStatus(jobId: string, status: JobStatus): Promise<Job> {
    const response = await apiClient.patch<Job>(`/api/jobs/${jobId}/status`, { status });
    return response.data;
  },

  /**
   * Delete a job
   */
  async deleteJob(jobId: string): Promise<void> {
    await apiClient.delete(`/api/jobs/${jobId}`);
  },

  /**
   * Sync jobs for a specific date (partial sync)
   */
  async syncJobs(date: string, technicianId?: string): Promise<Job[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('date', date);
    
    if (technicianId) {
      queryParams.append('technicianId', technicianId);
    }

    const response = await apiClient.get<Job[]>(
      `/api/jobs/sync?${queryParams.toString()}`
    );
    
    return Array.isArray(response.data) ? response.data : [response.data];
  },
};

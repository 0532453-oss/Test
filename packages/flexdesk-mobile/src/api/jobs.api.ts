/**
 * Jobs API functions.
 *
 * Endpoints for creating, listing, syncing, and managing jobs.
 */

import apiClient from './client';
import type {
  AssignJobRequest,
  CreateJobRequest,
  Job,
  JobAttachment,
  JobDetails,
  UpdateJobRequest,
  UpdateJobStatusRequest,
} from './types';

/** Create a new job. */
export async function createJob(req: CreateJobRequest): Promise<Job> {
  const { data } = await apiClient.post<Job>('/jobs', req);
  return data;
}

/** List jobs with optional filters. */
export async function listJobs(params?: {
  status?: string;
  customerId?: string;
  technicianId?: string;
}): Promise<Job[]> {
  const { data } = await apiClient.get<Job[]>('/jobs', { params });
  return data;
}

/** Get jobs for a specific date (technician's daily view). */
export async function syncJobs(date: string): Promise<Job[]> {
  const { data } = await apiClient.get<Job[]>('/jobs/sync', {
    params: { date },
  });
  return data;
}

/** Get jobs in a date range (for week strip dot indicators). */
export async function getScheduledJobs(
  startDate: string,
  endDate: string,
): Promise<Job[]> {
  const { data } = await apiClient.get<Job[]>('/jobs/scheduled', {
    params: { startDate, endDate },
  });
  return data;
}

/** Get a single job by ID. */
export async function getJobById(id: string): Promise<Job> {
  const { data } = await apiClient.get<Job>(`/jobs/${id}`);
  return data;
}

/** Get a job with all relations (customer, technician, notes, parts, attachments). */
export async function getJobDetails(id: string): Promise<JobDetails> {
  const { data } = await apiClient.get<JobDetails>(`/jobs/${id}/details`);
  return data;
}

/** Update a job's fields. */
export async function updateJob(id: string, req: UpdateJobRequest): Promise<Job> {
  const { data } = await apiClient.put<Job>(`/jobs/${id}`, req);
  return data;
}

/** Update a job's status (e.g., DISPATCHED → IN_PROGRESS). */
export async function updateJobStatus(
  id: string,
  req: UpdateJobStatusRequest,
): Promise<Job> {
  const { data } = await apiClient.patch<Job>(`/jobs/${id}/status`, req);
  return data;
}

/** Add a note to a job via PUT /jobs/:id with notes field. */
export async function addJobNote(
  id: string,
  content: string,
): Promise<Job> {
  const { data } = await apiClient.put<Job>(`/jobs/${id}`, { notes: content });
  return data;
}

/** Assign a technician to a job. */
export async function assignJob(id: string, req: AssignJobRequest): Promise<Job> {
  const { data } = await apiClient.patch<Job>(`/jobs/${id}/assign`, req);
  return data;
}

/** Upload a photo attachment to a job (multipart/form-data). */
export async function uploadJobAttachment(
  jobId: string,
  file: { uri: string; fileName: string; type: string },
  onProgress?: (percent: number) => void,
): Promise<JobAttachment> {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.fileName,
    type: file.type,
  } as unknown as Blob);

  const { data } = await apiClient.post<JobAttachment>(
    `/jobs/${jobId}/attachments`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    },
  );
  return data;
}

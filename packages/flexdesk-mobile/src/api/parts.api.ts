/**
 * Parts API functions.
 *
 * Endpoints for inventory parts and job parts management.
 */

import apiClient from './client';
import type {
  AddJobPartRequest,
  JobPart,
  JobPartTotals,
  Part,
  UpdateJobPartRequest,
} from './types';

/** List available parts from inventory (with optional search). */
export async function listParts(search?: string): Promise<Part[]> {
  const { data } = await apiClient.get<Part[]>('/parts', {
    params: search ? { search } : undefined,
  });
  return data;
}

/** Add a part to a job. */
export async function addJobPart(
  jobId: string,
  req: AddJobPartRequest,
): Promise<JobPart> {
  const { data } = await apiClient.post<JobPart>(`/jobs/${jobId}/parts`, req);
  return data;
}

/** Get parts totals for a job (cost, price, profit). */
export async function getJobPartTotals(jobId: string): Promise<JobPartTotals> {
  const { data } = await apiClient.get<JobPartTotals>(
    `/jobs/${jobId}/parts/totals`,
  );
  return data;
}

/** Adjust quantity of a part on a job. */
export async function updateJobPart(
  jobId: string,
  jobPartId: string,
  req: UpdateJobPartRequest,
): Promise<JobPart> {
  const { data } = await apiClient.patch<JobPart>(
    `/jobs/${jobId}/parts/${jobPartId}`,
    req,
  );
  return data;
}

/** Remove a part from a job. */
export async function removeJobPart(
  jobId: string,
  jobPartId: string,
): Promise<void> {
  await apiClient.delete(`/jobs/${jobId}/parts/${jobPartId}`);
}

/**
 * React Query hooks for jobs.
 */

import { useQuery } from '@tanstack/react-query';
import { syncJobs, getScheduledJobs, getJobDetails } from '../api/jobs.api';
import type { Job, JobDetails } from '../api/types';

/** Fetch jobs for a specific date (technician daily view). */
export function useJobs(date: string, options?: { refetchInterval?: number }) {
  return useQuery<Job[]>({
    queryKey: ['jobs', 'sync', date],
    queryFn: () => syncJobs(date),
    enabled: !!date,
    refetchInterval: options?.refetchInterval,
  });
}

/** Fetch jobs in a date range (week strip dot indicators). */
export function useScheduledJobs(startDate: string, endDate: string) {
  return useQuery<Job[]>({
    queryKey: ['jobs', 'scheduled', startDate, endDate],
    queryFn: () => getScheduledJobs(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

/** Fetch a single job with full details. */
export function useJobDetails(id: string | undefined) {
  return useQuery<JobDetails>({
    queryKey: ['jobs', 'details', id],
    queryFn: () => getJobDetails(id!),
    enabled: !!id,
  });
}

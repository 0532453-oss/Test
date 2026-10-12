/**
 * Hook to fetch multiple jobs with filters
 */

import {
  useFindManyRecords,
  type RecordFilter,
  type RecordOrderBy,
} from '@service-flex/core';
import type { Job, JobStatus, JobPriority } from '@service-flex/types';

export interface JobFilters extends RecordFilter {
  status?: JobStatus;
  priority?: JobPriority;
  technicianId?: string;
  customerId?: string;
  scheduledAt?: {
    gte?: string;
    lte?: string;
  };
}

export interface UseFindManyJobsOptions {
  filter?: JobFilters;
  orderBy?: RecordOrderBy[];
  limit?: number;
  skip?: boolean;
  onCompleted?: (jobs: Job[]) => void;
  onError?: (error: Error) => void;
}

export interface UseFindManyJobsReturn {
  records: Job[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  fetchMore: () => Promise<void>;
  hasMore: boolean;
}

export function useFindManyJobs(options: UseFindManyJobsOptions = {}): UseFindManyJobsReturn {
  const { filter, orderBy, limit, skip, onCompleted, onError } = options;
  
  const result = useFindManyRecords<Job>({
    objectNameSingular: 'Job',
    filter,
    orderBy,
    limit,
    skip,
    onCompleted,
    onError,
  });

  return {
    records: result.records,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
    fetchMore: result.fetchMore,
    hasMore: result.hasMore,
  };
}

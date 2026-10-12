/**
 * Hook to get and monitor job status
 */

import { useFindOneJob } from './useFindOneJob';
import type { JobStatus } from '../types/JobStatus';

export function useJobStatus(jobId: string) {
  const { record: job, loading, error } = useFindOneJob(jobId);

  return {
    status: job?.status as JobStatus | undefined,
    loading,
    error,
  };
}

/**
 * Hook to update a job with optimistic updates
 */

import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import type { Job } from '../types/Job';

export function useUpdateJob(jobId: string) {
  return useUpdateOneRecord<Job>({
    objectNameSingular: 'Job',
    objectRecordId: jobId,
  });
}

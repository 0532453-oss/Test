/**
 * Hook to fetch a single job
 */

import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import type { Job } from '../types/Job';

export function useFindOneJob(jobId: string, options?: { skip?: boolean }) {
  return useFindOneRecord<Job>({
    objectNameSingular: 'Job',
    objectRecordId: jobId,
    skip: options?.skip,
  });
}

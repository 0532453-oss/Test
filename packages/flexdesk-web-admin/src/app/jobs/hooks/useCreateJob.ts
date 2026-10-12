/**
 * Hook to create a job with optimistic updates
 */

import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import type { Job } from '../types/Job';

export function useCreateJob() {
  return useCreateOneRecord<Job>({
    objectNameSingular: 'Job',
  });
}

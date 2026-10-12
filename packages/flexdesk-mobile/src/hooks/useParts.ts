/**
 * React Query hooks for parts inventory.
 */

import { useQuery } from '@tanstack/react-query';
import { listParts, getJobPartTotals } from '../api/parts.api';

/** Fetch available parts from inventory with optional search. */
export function useParts(search?: string) {
  return useQuery({
    queryKey: ['parts', search ?? ''],
    queryFn: () => listParts(search),
    staleTime: 10 * 60 * 1000, // 10 min — inventory changes infrequently
  });
}

/** Fetch parts totals (cost, price, profit) for a specific job. */
export function useJobPartTotals(jobId: string | undefined) {
  return useQuery({
    queryKey: ['jobs', 'parts-totals', jobId],
    queryFn: () => getJobPartTotals(jobId!),
    enabled: !!jobId,
  });
}

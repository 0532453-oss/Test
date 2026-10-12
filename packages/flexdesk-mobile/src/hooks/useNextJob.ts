/**
 * React Query hook for fetching the technician's next upcoming job.
 */

import { useQuery } from '@tanstack/react-query';
import { getNextJob } from '../api/technicians.api';
import type { NextJobResponse } from '../api/types';

/** Fetch the next upcoming job for the given technician. */
export function useNextJob(technicianId: string | undefined) {
  return useQuery<NextJobResponse>({
    queryKey: ['nextJob', technicianId],
    queryFn: () => getNextJob(technicianId!),
    enabled: !!technicianId,
  });
}

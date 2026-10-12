/**
 * React Query hook for dashboard summary.
 */

import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../api/reports.api';
import type { DashboardSummary } from '../api/types';

/** Fetch the combined dashboard summary (metrics, revenue, job stats). */
export function useDashboard() {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  });
}

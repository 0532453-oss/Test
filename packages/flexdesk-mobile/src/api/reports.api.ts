/**
 * Reports API functions.
 *
 * Endpoints for dashboard summary, revenue, and technician performance reports.
 */

import apiClient from './client';
import type {
  DashboardSummary,
  RevenueReport,
  TechnicianPerformance,
} from './types';

/** Get the combined dashboard summary (metrics, revenue, job stats). */
export async function getDashboard(): Promise<DashboardSummary> {
  const { data } = await apiClient.get<DashboardSummary>('/reports/dashboard');
  return data;
}

/** Get revenue breakdown (this month, week, day, YTD). */
export async function getRevenue(): Promise<RevenueReport> {
  const { data } = await apiClient.get<RevenueReport>('/reports/revenue');
  return data;
}

/** Get technician performance metrics. */
export async function getTechnicianPerformance(): Promise<TechnicianPerformance[]> {
  const { data } = await apiClient.get<TechnicianPerformance[]>(
    '/reports/technician-performance',
  );
  return data;
}

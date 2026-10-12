/**
 * Job Completion Event
 *
 * Tracks when a job is completed, including timing metrics,
 * on-time performance, and revenue data.
 */

import { AnalyticsEvent } from '../../providers';

export interface JobCompletionEvent {
  jobId: string;
  workspaceId: string;
  technicianId: string;
  customerId: string;
  jobType: string;
  durationMinutes: number;
  scheduledDurationMinutes: number;
  wasOnTime: boolean;
  invoiceTotal: number;
  completedAt: Date;
}

export function createJobCompletionEvent(data: JobCompletionEvent): AnalyticsEvent {
  const efficiencyRatio =
    data.scheduledDurationMinutes > 0
      ? Math.round((data.durationMinutes / data.scheduledDurationMinutes) * 100) / 100
      : null;

  return {
    name: 'job.completed',
    properties: {
      jobId: data.jobId,
      technicianId: data.technicianId,
      customerId: data.customerId,
      jobType: data.jobType,
      durationMinutes: data.durationMinutes,
      scheduledDurationMinutes: data.scheduledDurationMinutes,
      efficiencyRatio,
      wasOnTime: data.wasOnTime,
      invoiceTotal: data.invoiceTotal,
    },
    timestamp: data.completedAt,
    workspaceId: data.workspaceId,
  };
}

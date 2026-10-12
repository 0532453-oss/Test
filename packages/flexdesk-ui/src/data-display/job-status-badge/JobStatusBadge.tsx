/**
 * Job Status Badge Component
 * 
 * Displays job status with appropriate styling
 */

import type { JobStatus } from '../types/JobStatus';

interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
}

const statusColors: Record<JobStatus, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  DISPATCHED: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  ON_HOLD: 'bg-orange-100 text-orange-800',
};

const statusLabels: Record<JobStatus, string> = {
  SCHEDULED: 'Scheduled',
  DISPATCHED: 'Dispatched',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  ON_HOLD: 'On Hold',
};

export function JobStatusBadge({ status, className = '' }: JobStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]} ${className}`}
    >
      {statusLabels[status]}
    </span>
  );
}

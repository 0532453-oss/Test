/**
 * Job Type Definition for Components
 */

export type JobStatus =
  | 'SCHEDULED'
  | 'DISPATCHED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ON_HOLD';

export type JobPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface JobLocation {
  address?: string;
  lat: number;
  lng: number;
}

export interface Job {
  id: string;
  title: string;
  description?: string | null;
  status: JobStatus;
  priority: JobPriority;
  scheduledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  location?: JobLocation | null;
  estimatedDuration?: number | null;
  customerId: string;
  technicianId?: string | null;
}

export const jobStatusColors: Record<JobStatus, string> = {
  SCHEDULED: '#3498db',
  DISPATCHED: '#9b59b6',
  IN_PROGRESS: '#f39c12',
  COMPLETED: '#27ae60',
  CANCELLED: '#95a5a6',
  ON_HOLD: '#e74c3c',
};

export const jobStatusLabels: Record<JobStatus, string> = {
  SCHEDULED: 'Scheduled',
  DISPATCHED: 'Dispatched',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  ON_HOLD: 'On Hold',
};

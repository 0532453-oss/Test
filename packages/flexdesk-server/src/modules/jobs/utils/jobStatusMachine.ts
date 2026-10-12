/**
 * Job Status State Machine
 * 
 * Defines valid state transitions for job status
 */

import { type JobStatus } from '../types/JobStatus';

export type JobStatusTransition = {
  from: JobStatus;
  to: JobStatus;
  requiresGeofence?: boolean;
};

/**
 * Valid state transitions
 */
export const JOB_STATUS_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  SCHEDULED: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['IN_PROGRESS', 'CANCELLED'], // IN_PROGRESS requires geofencing
  IN_PROGRESS: ['COMPLETED', 'ON_HOLD', 'CANCELLED'],
  ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

/**
 * Check if a status transition is valid
 */
export function isValidTransition(
  from: JobStatus,
  to: JobStatus
): boolean {
  const allowedTransitions = JOB_STATUS_TRANSITIONS[from];
  return allowedTransitions.includes(to);
}

/**
 * Check if a transition requires geofencing
 */
export function requiresGeofence(
  from: JobStatus,
  to: JobStatus
): boolean {
  // DISPATCHED -> IN_PROGRESS requires geofencing
  return from === 'DISPATCHED' && to === 'IN_PROGRESS';
}

/**
 * Get all valid transitions from a given status
 */
export function getValidTransitions(from: JobStatus): JobStatus[] {
  return JOB_STATUS_TRANSITIONS[from] || [];
}

/**
 * Check if status is terminal (no more transitions allowed)
 */
export function isTerminalStatus(status: JobStatus): boolean {
  return JOB_STATUS_TRANSITIONS[status].length === 0;
}

/**
 * Get next statuses that can be reached from current status
 */
export function getNextStatuses(currentStatus: JobStatus): {
  status: JobStatus;
  requiresGeofence: boolean;
}[] {
  return getValidTransitions(currentStatus).map((status) => ({
    status,
    requiresGeofence: requiresGeofence(currentStatus, status),
  }));
}

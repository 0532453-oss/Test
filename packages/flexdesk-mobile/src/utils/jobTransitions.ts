/**
 * Valid job status transitions.
 *
 * Maps each status to the list of statuses it can transition to.
 * Used to determine which action buttons to show on the Job Detail screen.
 */

import type { JobStatus } from '../api/types';

export const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  SCHEDULED: ['IN_PROGRESS', 'CANCELLED'],
  DISPATCHED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'ON_HOLD', 'CANCELLED'],
  ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export interface StatusAction {
  label: string;
  targetStatus: JobStatus;
  variant: 'primary' | 'secondary' | 'destructive';
  requiresGeofence: boolean;
}

/**
 * Check whether a transition from one status to another is valid.
 * Should be called before submitting a status change to the API.
 */
export function canTransitionTo(
  currentStatus: JobStatus,
  targetStatus: JobStatus,
): boolean {
  const validTargets = VALID_TRANSITIONS[currentStatus];
  return !!validTargets && validTargets.includes(targetStatus);
}

/**
 * Get the available status actions for a given job status.
 * Only returns actions whose target status is in VALID_TRANSITIONS.
 */
export function getStatusActions(status: JobStatus): StatusAction[] {
  const validTargets = VALID_TRANSITIONS[status];
  if (!validTargets || validTargets.length === 0) return [];

  const actions: StatusAction[] = [];

  if (validTargets.includes('IN_PROGRESS')) {
    const isResume = status === 'ON_HOLD';
    actions.push({
      label: isResume ? 'Resume Job' : 'Start Job',
      targetStatus: 'IN_PROGRESS',
      variant: 'primary',
      // Geofence only required when starting (from SCHEDULED/DISPATCHED), not resuming
      requiresGeofence: !isResume,
    });
  }

  if (validTargets.includes('COMPLETED')) {
    actions.push({
      label: 'Complete Job',
      targetStatus: 'COMPLETED',
      variant: 'primary',
      requiresGeofence: false,
    });
  }

  if (validTargets.includes('ON_HOLD')) {
    actions.push({
      label: 'Put On Hold',
      targetStatus: 'ON_HOLD',
      variant: 'secondary',
      requiresGeofence: false,
    });
  }

  if (validTargets.includes('CANCELLED')) {
    actions.push({
      label: 'Cancel Job',
      targetStatus: 'CANCELLED',
      variant: 'destructive',
      requiresGeofence: false,
    });
  }

  return actions;
}

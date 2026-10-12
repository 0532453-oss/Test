/**
 * Validate job status transitions
 */

import type { JobStatus } from '../types/JobStatus';

import { isValidTransition, requiresGeofence } from './jobStatusMachine';

export interface TransitionValidationResult {
  valid: boolean;
  requiresGeofence: boolean;
  error?: string;
}

/**
 * Validate if a job status transition is allowed
 */
export function validateJobTransition(
  from: JobStatus,
  to: JobStatus
): TransitionValidationResult {
  if (!isValidTransition(from, to)) {
    return {
      valid: false,
      requiresGeofence: false,
      error: `Invalid transition from ${from} to ${to}`,
    };
  }

  return {
    valid: true,
    requiresGeofence: requiresGeofence(from, to),
  };
}

import type { JobStatus } from '../types/JobStatus';
export interface TransitionValidationResult {
    valid: boolean;
    requiresGeofence: boolean;
    error?: string;
}
export declare function validateJobTransition(from: JobStatus, to: JobStatus): TransitionValidationResult;

import { type JobStatus } from '../types/JobStatus';
export type JobStatusTransition = {
    from: JobStatus;
    to: JobStatus;
    requiresGeofence?: boolean;
};
export declare const JOB_STATUS_TRANSITIONS: Record<JobStatus, JobStatus[]>;
export declare function isValidTransition(from: JobStatus, to: JobStatus): boolean;
export declare function requiresGeofence(from: JobStatus, to: JobStatus): boolean;
export declare function getValidTransitions(from: JobStatus): JobStatus[];
export declare function isTerminalStatus(status: JobStatus): boolean;
export declare function getNextStatuses(currentStatus: JobStatus): {
    status: JobStatus;
    requiresGeofence: boolean;
}[];

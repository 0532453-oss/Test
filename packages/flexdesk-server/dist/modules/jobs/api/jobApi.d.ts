import type { Job } from '../types/Job';
import type { JobStatus } from '../types/JobStatus';
export declare const jobApi: {
    getJob(jobId: string): Promise<Job>;
    getJobs(params?: {
        filter?: Record<string, any>;
        orderBy?: Array<{
            field: string;
            direction: "asc" | "desc";
        }>;
        limit?: number;
        offset?: number;
    }): Promise<{
        data: Job[];
        hasMore: boolean;
    }>;
    createJob(data: Partial<Job>): Promise<Job>;
    updateJob(jobId: string, data: Partial<Job>): Promise<Job>;
    updateJobStatus(jobId: string, status: JobStatus): Promise<Job>;
    deleteJob(jobId: string): Promise<void>;
    syncJobs(date: string, technicianId?: string): Promise<Job[]>;
};

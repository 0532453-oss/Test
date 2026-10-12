import { type Job, JobStatus } from '@prisma/client';
import { type AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
import { type CreateJobDto, type DateRangeQueryDto } from '../dto/create-job.dto';
import { type UpdateJobStatusDto } from '../dto/update-job-status.dto';
import { type UpdateJobDto } from '../dto/update-job.dto';
import { type JobService } from '../job.service';
export declare class JobController {
    private readonly jobService;
    constructor(jobService: JobService);
    create(dto: CreateJobDto): Promise<Job>;
    findAll(status?: JobStatus, customerId?: string, technicianId?: string): Promise<Job[]>;
    syncJobs(date: string | undefined, user: AuthenticatedUser): Promise<Job[]>;
    getScheduledJobs(dateRange: DateRangeQueryDto): Promise<Job[]>;
    findOne(id: string): Promise<Job>;
    getJobDetails(id: string): Promise<Job>;
    update(id: string, dto: UpdateJobDto): Promise<Job>;
    updateStatus(id: string, body: UpdateJobStatusDto): Promise<Job>;
    assignTechnician(id: string, technicianId: string): Promise<Job>;
    delete(id: string): Promise<Job>;
}

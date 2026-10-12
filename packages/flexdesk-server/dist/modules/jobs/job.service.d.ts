import { type Job, JobStatus, Prisma } from '@prisma/client';
import { type BillingService } from '../billing/invoice-manager/billing.service';
import { type NotificationService } from '../notifications/notification.service';
import { type CreateJobDto } from './dto/create-job.dto';
import { type UpdateJobDto } from './dto/update-job.dto';
import { type PrismaService } from '@/core/database/prisma.service';
import { BaseService } from '@/engine/base.service';
export interface JobFilters {
    status?: JobStatus;
    customerId?: string;
    technicianId?: string;
}
export declare class JobService extends BaseService<Prisma.JobDelegate> {
    private readonly billingService;
    private readonly notificationService;
    constructor(prisma: PrismaService, billingService: BillingService, notificationService: NotificationService);
    createJob(dto: CreateJobDto): Promise<Job>;
    findAllJobs(filters?: JobFilters): Promise<Job[]>;
    findJobsByDateRange(startDate: Date, endDate: Date): Promise<Job[]>;
    getJobWithDetails(id: string): Promise<Job>;
    updateJob(id: string, dto: UpdateJobDto): Promise<Job>;
    assignTechnician(jobId: string, technicianId: string): Promise<Job>;
    deleteJob(id: string): Promise<Job>;
    findTechnicianJobsForDate(userId: string, date: Date): Promise<Job[]>;
    getJobById(id: string): Promise<Job>;
    transitionStatus(jobId: string, nextStatus: JobStatus): Promise<Job>;
}

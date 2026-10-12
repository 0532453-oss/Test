import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  type Job,
  JobStatus,
  JobPriority,
  Prisma,
  SyncStatus,
} from '@prisma/client';

import { BillingService } from '../billing/invoice-manager/billing.service';
import { NotificationService } from '../notifications/notification.service';

import { type CreateJobDto } from './dto/create-job.dto';
import { type UpdateJobDto } from './dto/update-job.dto';
import {
  GeofenceError,
  isValidLocation,
  validateJobGeofence,
} from './utils/geofenceValidator';
import {
  isValidTransition,
  requiresGeofence,
} from './utils/jobStatusMachine';

import { PrismaService } from '@/core/database/prisma.service';
import { BaseService } from '@/engine/base.service';

export interface JobFilters {
  status?: JobStatus;
  customerId?: string;
  technicianId?: string;
}

@Injectable()
export class JobService extends BaseService<Prisma.JobDelegate> {
  constructor(
    prisma: PrismaService,
    private readonly billingService: BillingService,
    private readonly notificationService: NotificationService,
  ) {
    super(prisma, prisma.job, 'Job');
  }

  async createJob(dto: CreateJobDto): Promise<Job> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    // Support both legacy scheduledAt and new separate fields
    let scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : undefined;

    // If new fields provided, compute scheduledAt for backwards compatibility
    if (dto.scheduledDate && !scheduledAt) {
      const time = dto.scheduledStartTime || '00:00';
      scheduledAt = new Date(`${dto.scheduledDate}T${time}:00`);
    }

    const data: Prisma.JobCreateInput = {
      workspace: { connect: { id: workspaceId } },
      customer: { connect: { id: dto.customerId } },
      title: dto.title,
      description: dto.description,
      priority: dto.priority || JobPriority.MEDIUM,
      status: JobStatus.SCHEDULED,
      scheduledAt,
      scheduledDate: dto.scheduledDate,
      scheduledStartTime: dto.scheduledStartTime,
      scheduledEndTime: dto.scheduledEndTime,
      estimatedDuration: dto.estimatedDuration,
      location: dto.location as Prisma.InputJsonValue | undefined,
      syncStatus: SyncStatus.PENDING,
      syncVersion: 0,
    };

    // Support both technicianId and assignedTechnicianId
    const techId = dto.technicianId || dto.assignedTechnicianId;
    if (techId) {
      data.technician = { connect: { id: techId } };
    }

    const job = await this.create({ data });
    return job as Job;
  }

  async findAllJobs(filters: JobFilters = {}): Promise<Job[]> {
    const where: Prisma.JobWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.customerId) {
      where.customerId = filters.customerId;
    }
    if (filters.technicianId) {
      where.technicianId = filters.technicianId;
    }

    const jobs = await this.findMany({
      where,
      include: {
        customer: true,
        technician: { include: { user: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return jobs as Job[];
  }

  async findJobsByDateRange(startDate: Date, endDate: Date): Promise<Job[]> {
    // Format dates as YYYY-MM-DD strings for scheduledDate comparison
    const startDateStr = startDate.toISOString().slice(0, 10);
    const endDateStr = endDate.toISOString().slice(0, 10);

    const jobs = await this.findMany({
      where: {
        OR: [
          {
            scheduledAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            scheduledDate: {
              gte: startDateStr,
              lte: endDateStr,
            },
            scheduledAt: null,
          },
        ],
      } as Prisma.JobWhereInput,
      include: {
        customer: true,
        technician: { include: { user: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return jobs as Job[];
  }

  async getJobWithDetails(id: string): Promise<Job> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const job = await this.prisma.job.findFirst({
      where: { id, workspaceId },
      include: {
        customer: true,
        technician: { include: { user: true } },
        invoice: { include: { lineItems: true } },
        jobNotes: true,
        jobAttachments: true,
        recurringTemplate: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async updateJob(id: string, dto: UpdateJobDto): Promise<Job> {
    const existing = await this.getJobById(id);

    // Support both legacy scheduledAt and new separate fields
    let scheduledAt: Date | undefined;
    if (dto.scheduledAt) {
      scheduledAt = new Date(dto.scheduledAt);
    } else if (dto.scheduledDate) {
      const time = dto.scheduledStartTime || '00:00';
      scheduledAt = new Date(`${dto.scheduledDate}T${time}:00`);
    }

    const data: Prisma.JobUpdateInput = {
      ...(dto.title && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.priority && { priority: dto.priority }),
      ...(dto.status && { status: dto.status }),
      ...(scheduledAt && { scheduledAt }),
      ...(dto.scheduledDate !== undefined && { scheduledDate: dto.scheduledDate }),
      ...(dto.scheduledStartTime !== undefined && { scheduledStartTime: dto.scheduledStartTime }),
      ...(dto.scheduledEndTime !== undefined && { scheduledEndTime: dto.scheduledEndTime }),
      ...(dto.estimatedDuration !== undefined && {
        estimatedDuration: dto.estimatedDuration,
      }),
      ...(dto.location !== undefined && {
        location: dto.location === null ? Prisma.JsonNull : (dto.location as Prisma.InputJsonValue),
      }),
      syncStatus: SyncStatus.PENDING,
      syncVersion: existing.syncVersion + 1,
    };

    // Support both technicianId and assignedTechnicianId
    const techId = dto.technicianId || dto.assignedTechnicianId;
    if (techId) {
      data.technician = { connect: { id: techId } };
    }

    const job = await this.update({
      where: { id },
      data,
    });

    return job as Job;
  }

  async assignTechnician(jobId: string, technicianId: string): Promise<Job> {
    const existing = await this.getJobById(jobId);

    const job = await this.update({
      where: { id: jobId },
      data: {
        technician: { connect: { id: technicianId } },
        syncStatus: SyncStatus.PENDING,
        syncVersion: existing.syncVersion + 1,
      },
    });

    return job as Job;
  }

  async deleteJob(id: string): Promise<Job> {
    await this.getJobById(id);
    const job = await this.delete({ where: { id } });
    return job as Job;
  }

  async findTechnicianJobsForDate(
    userId: string,
    date: Date,
  ): Promise<Job[]> {
    const technician = await this.prisma.technician.findFirst({
      where: { userId },
    });

    if (!technician) {
      throw new NotFoundException('Technician not found for current user');
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const jobs = await this.findMany({
      where: {
        technicianId: technician.id,
        OR: [
          {
            scheduledAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          {
            scheduledDate: dateStr,
            scheduledAt: null,
          },
        ],
      } as Prisma.JobWhereInput,
    });

    return jobs as Job[];
  }

  async getJobById(id: string): Promise<Job> {
    const job = await this.findUniqueOrThrow({ where: { id } });

    return job as Job;
  }

  async transitionStatus(jobId: string, nextStatus: JobStatus): Promise<Job> {
    const job = await this.getJobById(jobId);
    const currentStatus = job.status;

    if (!isValidTransition(currentStatus, nextStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${nextStatus}`,
      );
    }

    if (requiresGeofence(currentStatus, nextStatus)) {
      if (!job.technicianId) {
        throw new BadRequestException('Technician is required to start job');
      }

      const technician = await this.prisma.technician.findUnique({
        where: { id: job.technicianId },
      });

      if (!technician) {
        throw new NotFoundException('Technician not found');
      }

      const jobLocation = (job.location ?? null) as any;
      const technicianLocation = (technician.currentLocation ?? null) as any;

      if (!isValidLocation(jobLocation) || !isValidLocation(technicianLocation)) {
        throw new ForbiddenException(
          'Valid job and technician locations are required for this transition',
        );
      }

      const result = await validateJobGeofence(
        { lat: jobLocation.lat, lng: jobLocation.lng },
        { lat: technicianLocation.lat, lng: technicianLocation.lng },
      );

      if (!result.valid) {
        throw new GeofenceError(result.distance, 500, result.message);
      }
    }

    const now = new Date();

    const data: Prisma.JobUpdateInput = {
      status: nextStatus,
      syncStatus: SyncStatus.PENDING,
      syncVersion: job.syncVersion + 1,
    };

    if (nextStatus === JobStatus.IN_PROGRESS && !job.startedAt) {
      data.startedAt = now;
    }

    if (nextStatus === JobStatus.COMPLETED && !job.completedAt) {
      data.completedAt = now;
    }

    const updatedJob = await this.update({
      where: { id: jobId },
      data,
    });

    if (nextStatus === JobStatus.DISPATCHED) {
      this.notificationService.logJobDispatched(updatedJob as Job, {
        previousStatus: currentStatus,
      });
    }

    if (nextStatus === JobStatus.COMPLETED) {
      const invoice = await this.billingService.createInvoiceFromJob(jobId);

      this.notificationService.logJobCompleted(updatedJob as Job, {
        previousStatus: currentStatus,
        invoice,
      });
    }

    return updatedJob as Job;
  }
}


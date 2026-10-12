import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { JobStatus, JobPriority, SyncStatus } from '@prisma/client';

import { BillingService } from '../billing/invoice-manager/billing.service';
import { NotificationService } from '../notifications/notification.service';

import { JobService } from './job.service';

import { PrismaService } from '@/core/database/prisma.service';
import * as workspaceContext from '@/core/database/workspace-context';

describe('JobService', () => {
  let service: JobService;
  let prismaService: PrismaService;
  let billingService: BillingService;

  const mockWorkspaceId = 'workspace-123';
  const mockJobId = 'job-123';
  const mockCustomerId = 'customer-123';
  const mockTechnicianId = 'technician-123';

  const mockJob = {
    id: mockJobId,
    workspaceId: mockWorkspaceId,
    customerId: mockCustomerId,
    technicianId: mockTechnicianId,
    title: 'Test Job',
    description: 'Test description',
    status: JobStatus.SCHEDULED,
    priority: JobPriority.MEDIUM,
    scheduledAt: new Date(),
    startedAt: null,
    completedAt: null,
    location: { lat: 37.7749, lng: -122.4194 },
    estimatedDuration: 60,
    syncStatus: SyncStatus.PENDING,
    syncVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    job: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    technician: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockBillingService = {
    createInvoiceFromJob: jest.fn(),
  };

  const mockNotificationService = {
    logJobDispatched: jest.fn(),
    logJobCompleted: jest.fn(),
  };

  beforeEach(async () => {
    jest.spyOn(workspaceContext, 'getWorkspaceId').mockReturnValue(mockWorkspaceId);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: BillingService, useValue: mockBillingService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<JobService>(JobService);
    prismaService = module.get<PrismaService>(PrismaService);
    billingService = module.get<BillingService>(BillingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createJob', () => {
    it('should create a new job', async () => {
      mockPrismaService.job.create.mockResolvedValue(mockJob);

      const dto = {
        title: 'Test Job',
        customerId: mockCustomerId,
        description: 'Test description',
        priority: JobPriority.MEDIUM,
      };

      const result = await service.createJob(dto);

      expect(result).toEqual(mockJob);
      expect(mockPrismaService.job.create).toHaveBeenCalled();
    });
  });

  describe('getJobById', () => {
    it('should return a job when found', async () => {
      mockPrismaService.job.findFirst.mockResolvedValue(mockJob);

      const result = await service.getJobById(mockJobId);

      expect(result).toEqual(mockJob);
    });

    it('should throw NotFoundException when job not found', async () => {
      mockPrismaService.job.findFirst.mockResolvedValue(null);

      await expect(service.getJobById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('transitionStatus', () => {
    it('should transition from SCHEDULED to DISPATCHED', async () => {
      mockPrismaService.job.findFirst.mockResolvedValue(mockJob);
      mockPrismaService.job.update.mockResolvedValue({
        ...mockJob,
        status: JobStatus.DISPATCHED,
      });

      const result = await service.transitionStatus(mockJobId, JobStatus.DISPATCHED);

      expect(result.status).toBe(JobStatus.DISPATCHED);
      expect(mockNotificationService.logJobDispatched).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid transition', async () => {
      mockPrismaService.job.findFirst.mockResolvedValue(mockJob);

      await expect(
        service.transitionStatus(mockJobId, JobStatus.COMPLETED),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create invoice when job completed', async () => {
      const inProgressJob = { ...mockJob, status: JobStatus.IN_PROGRESS };
      mockPrismaService.job.findFirst.mockResolvedValue(inProgressJob);
      mockPrismaService.job.update.mockResolvedValue({
        ...inProgressJob,
        status: JobStatus.COMPLETED,
        completedAt: new Date(),
      });
      mockBillingService.createInvoiceFromJob.mockResolvedValue({ id: 'invoice-123' });

      const result = await service.transitionStatus(mockJobId, JobStatus.COMPLETED);

      expect(result.status).toBe(JobStatus.COMPLETED);
      expect(mockBillingService.createInvoiceFromJob).toHaveBeenCalledWith(mockJobId);
    });
  });

  describe('findTechnicianJobsForDate', () => {
    it('should return jobs for technician on specific date', async () => {
      const mockTechnician = { id: mockTechnicianId, userId: 'user-123' };
      mockPrismaService.technician.findFirst.mockResolvedValue(mockTechnician);
      mockPrismaService.job.findMany.mockResolvedValue([mockJob]);

      const result = await service.findTechnicianJobsForDate('user-123', new Date());

      expect(result).toEqual([mockJob]);
    });

    it('should throw NotFoundException when technician not found', async () => {
      mockPrismaService.technician.findFirst.mockResolvedValue(null);

      await expect(
        service.findTechnicianJobsForDate('non-existent', new Date()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteJob', () => {
    it('should delete a job', async () => {
      mockPrismaService.job.findFirst.mockResolvedValue(mockJob);
      mockPrismaService.job.delete.mockResolvedValue(mockJob);

      const result = await service.deleteJob(mockJobId);

      expect(result).toEqual(mockJob);
    });
  });
});

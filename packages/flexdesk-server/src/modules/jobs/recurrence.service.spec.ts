import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { JobStatus, JobPriority, SyncStatus } from '@prisma/client';

import { RecurrenceService } from './recurrence.service';

import { PrismaService } from '@/core/database/prisma.service';
import * as workspaceContext from '@/core/database/workspace-context';

describe('RecurrenceService', () => {
  let service: RecurrenceService;

  const mockWorkspaceId = 'workspace-123';
  const mockTemplateId = 'template-123';
  const mockCustomerId = 'customer-123';

  const mockTemplate = {
    id: mockTemplateId,
    workspaceId: mockWorkspaceId,
    customerId: mockCustomerId,
    technicianId: null,
    title: 'Weekly Maintenance',
    description: 'Regular maintenance check',
    priority: JobPriority.MEDIUM,
    frequency: 'WEEKLY',
    interval: 1,
    dayOfWeek: 1, // Monday
    dayOfMonth: null,
    startDate: new Date('2024-01-01'),
    endDate: null,
    nextRunDate: new Date('2024-01-08'),
    estimatedDuration: 60,
    location: null,
    isActive: true,
    syncStatus: SyncStatus.PENDING,
    lastSyncedAt: null,
    syncVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService: any = {
    recurringJobTemplate: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    job: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((callback: (prisma: any) => any) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    jest.spyOn(workspaceContext, 'getWorkspaceId').mockReturnValue(mockWorkspaceId);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurrenceService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<RecurrenceService>(RecurrenceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateNextRunDate', () => {
    it('should calculate next weekly date', () => {
      const template = {
        ...mockTemplate,
        frequency: 'WEEKLY',
        dayOfWeek: 1, // Monday
        interval: 1,
      };

      const fromDate = new Date('2024-01-08'); // Monday
      const result = service.calculateNextRunDate(template as any, fromDate);

      // Should be next Monday (Jan 15)
      expect(result.getDay()).toBe(1); // Monday
      expect(result > fromDate).toBe(true);
    });

    it('should calculate next biweekly date', () => {
      const template = {
        ...mockTemplate,
        frequency: 'BIWEEKLY',
      };

      const fromDate = new Date('2024-01-08');
      const result = service.calculateNextRunDate(template as any, fromDate);

      const expectedDate = new Date('2024-01-22');
      expect(result.getDate()).toBe(expectedDate.getDate());
    });

    it('should calculate next monthly date', () => {
      const template = {
        ...mockTemplate,
        frequency: 'MONTHLY',
        dayOfMonth: 15,
        interval: 1,
      };

      const fromDate = new Date('2024-01-15');
      const result = service.calculateNextRunDate(template as any, fromDate);

      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(15);
    });

    it('should throw BadRequestException when exceeding endDate', () => {
      const template = {
        ...mockTemplate,
        frequency: 'WEEKLY',
        endDate: new Date('2024-01-08'),
      };

      const fromDate = new Date('2024-01-08');

      expect(() => service.calculateNextRunDate(template as any, fromDate)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('canGenerateJobForDate', () => {
    it('should return true when no job exists for date', async () => {
      mockPrismaService.job.findFirst.mockResolvedValue(null);

      const result = await service.canGenerateJobForDate(mockTemplateId, new Date());

      expect(result).toBe(true);
    });

    it('should return false when job already exists for date', async () => {
      mockPrismaService.job.findFirst.mockResolvedValue({ id: 'existing-job' });

      const result = await service.canGenerateJobForDate(mockTemplateId, new Date());

      expect(result).toBe(false);
    });
  });

  describe('generateJobFromTemplate', () => {
    it('should return existing job if one already exists (idempotent)', async () => {
      const existingJob = { id: 'existing-job', title: 'Test' };
      mockPrismaService.job.findFirst.mockResolvedValue(existingJob);

      const result = await service.generateJobFromTemplate(mockTemplateId, new Date());

      expect(result).toEqual(existingJob);
    });

    it('should create new job when none exists', async () => {
      mockPrismaService.job.findFirst
        .mockResolvedValueOnce(null) // First check outside transaction
        .mockResolvedValueOnce(null); // Check inside transaction
      mockPrismaService.recurringJobTemplate.findFirst.mockResolvedValue(mockTemplate);

      const newJob = {
        id: 'new-job',
        title: mockTemplate.title,
        status: JobStatus.SCHEDULED,
      };
      mockPrismaService.job.create.mockResolvedValue(newJob);
      mockPrismaService.recurringJobTemplate.update.mockResolvedValue(mockTemplate);

      const result = await service.generateJobFromTemplate(mockTemplateId, new Date());

      expect(result).toEqual(newJob);
    });

    it('should throw NotFoundException when template not found', async () => {
      mockPrismaService.job.findFirst.mockResolvedValue(null);
      mockPrismaService.recurringJobTemplate.findFirst.mockResolvedValue(null);

      await expect(
        service.generateJobFromTemplate('non-existent', new Date()),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when template inactive', async () => {
      mockPrismaService.job.findFirst.mockResolvedValue(null);
      mockPrismaService.recurringJobTemplate.findFirst.mockResolvedValue({
        ...mockTemplate,
        isActive: false,
      });

      await expect(
        service.generateJobFromTemplate(mockTemplateId, new Date()),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createTemplate', () => {
    it('should create a new recurring job template', async () => {
      mockPrismaService.recurringJobTemplate.create.mockResolvedValue(mockTemplate);

      const dto = {
        title: 'Weekly Maintenance',
        frequency: 'WEEKLY',
        interval: 1,
        startDate: new Date('2024-01-01'),
        customerId: mockCustomerId,
        dayOfWeek: 1,
      };

      const result = await service.createTemplate(dto);

      expect(result).toEqual(mockTemplate);
    });
  });
});

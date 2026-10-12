import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  EstimateStatus,
  JobPriority,
  SyncStatus,
  Prisma,
} from '@prisma/client';

import { EstimateService } from './estimate.service';

import { PrismaService } from '@/core/database/prisma.service';
import * as workspaceContext from '@/core/database/workspace-context';

describe('EstimateService', () => {
  let service: EstimateService;

  const mockWorkspaceId = 'workspace-123';
  const mockEstimateId = 'estimate-123';
  const mockCustomerId = 'customer-123';
  const mockJobId = 'job-456';

  const mockCustomer = {
    id: mockCustomerId,
    workspaceId: mockWorkspaceId,
    name: 'John Doe',
    email: 'john@example.com',
  };

  const mockEstimate = {
    id: mockEstimateId,
    workspaceId: mockWorkspaceId,
    customerId: mockCustomerId,
    estimateNumber: 'EST-20240115-ABC123',
    status: EstimateStatus.DRAFT,
    title: 'HVAC Repair',
    description: 'Replace compressor',
    subtotal: new Prisma.Decimal(500),
    tax: new Prisma.Decimal(50),
    discount: new Prisma.Decimal(0),
    total: new Prisma.Decimal(550),
    validUntil: new Date('2024-02-15'),
    sentAt: null,
    viewedAt: null,
    respondedAt: null,
    estimatedDuration: 120,
    location: { address: '123 Main St', lat: 40.7128, lng: -74.006 },
    priority: JobPriority.MEDIUM,
    convertedJobId: null,
    notes: null,
    customerNotes: null,
    terms: null,
    syncStatus: SyncStatus.PENDING,
    syncVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    lineItems: [
      {
        id: 'line-1',
        estimateId: mockEstimateId,
        description: 'Labor',
        quantity: new Prisma.Decimal(2),
        unitPrice: new Prisma.Decimal(100),
        total: new Prisma.Decimal(200),
        serviceType: 'labor',
      },
      {
        id: 'line-2',
        estimateId: mockEstimateId,
        description: 'Parts',
        quantity: new Prisma.Decimal(1),
        unitPrice: new Prisma.Decimal(300),
        total: new Prisma.Decimal(300),
        serviceType: 'parts',
      },
    ],
    customer: mockCustomer,
  };

  const mockPrismaService = {
    customer: {
      findFirst: jest.fn(),
    },
    estimate: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    job: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.spyOn(workspaceContext, 'getWorkspaceId').mockReturnValue(mockWorkspaceId);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstimateService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<EstimateService>(EstimateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new estimate', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrismaService.estimate.create.mockResolvedValue(mockEstimate);

      const result = await service.create({
        customerId: mockCustomerId,
        title: 'HVAC Repair',
        description: 'Replace compressor',
        lineItems: [
          { description: 'Labor', quantity: 2, unitPrice: 100, serviceType: 'labor' },
          { description: 'Parts', quantity: 1, unitPrice: 300, serviceType: 'parts' },
        ],
      });

      expect(result).toEqual(mockEstimate);
      expect(mockPrismaService.estimate.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.create({
          customerId: 'non-existent',
          title: 'Test',
          lineItems: [{ description: 'Item', quantity: 1, unitPrice: 100 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all estimates', async () => {
      mockPrismaService.estimate.findMany.mockResolvedValue([mockEstimate]);

      const result = await service.findAll();

      expect(result).toEqual([mockEstimate]);
    });

    it('should filter by status when provided', async () => {
      mockPrismaService.estimate.findMany.mockResolvedValue([mockEstimate]);

      await service.findAll(EstimateStatus.DRAFT);

      expect(mockPrismaService.estimate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: EstimateStatus.DRAFT,
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return estimate by id', async () => {
      mockPrismaService.estimate.findFirst.mockResolvedValue(mockEstimate);

      const result = await service.findById(mockEstimateId);

      expect(result).toEqual(mockEstimate);
    });

    it('should throw NotFoundException when estimate not found', async () => {
      mockPrismaService.estimate.findFirst.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a draft estimate', async () => {
      mockPrismaService.estimate.findFirst.mockResolvedValue(mockEstimate);
      mockPrismaService.estimate.update.mockResolvedValue({
        ...mockEstimate,
        title: 'Updated Title',
      });

      const result = await service.update(mockEstimateId, {
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
    });

    it('should throw BadRequestException when estimate is not draft', async () => {
      mockPrismaService.estimate.findFirst.mockResolvedValue({
        ...mockEstimate,
        status: EstimateStatus.SENT,
      });

      await expect(
        service.update(mockEstimateId, { title: 'New Title' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('send', () => {
    it('should send a draft estimate', async () => {
      mockPrismaService.estimate.findFirst.mockResolvedValue(mockEstimate);
      mockPrismaService.estimate.update.mockResolvedValue({
        ...mockEstimate,
        status: EstimateStatus.SENT,
        sentAt: new Date(),
      });

      const result = await service.send(mockEstimateId);

      expect(result.status).toBe(EstimateStatus.SENT);
      expect(result.sentAt).toBeDefined();
    });

    it('should throw BadRequestException when estimate is not draft', async () => {
      mockPrismaService.estimate.findFirst.mockResolvedValue({
        ...mockEstimate,
        status: EstimateStatus.SENT,
      });

      await expect(service.send(mockEstimateId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('markViewed', () => {
    it('should mark sent estimate as viewed', async () => {
      mockPrismaService.estimate.findFirst.mockResolvedValue({
        ...mockEstimate,
        status: EstimateStatus.SENT,
      });
      mockPrismaService.estimate.update.mockResolvedValue({
        ...mockEstimate,
        status: EstimateStatus.VIEWED,
        viewedAt: new Date(),
      });

      const result = await service.markViewed(mockEstimateId);

      expect(result.status).toBe(EstimateStatus.VIEWED);
      expect(result.viewedAt).toBeDefined();
    });

    it('should throw BadRequestException when estimate is not sent', async () => {
      mockPrismaService.estimate.findFirst.mockResolvedValue(mockEstimate);

      await expect(service.markViewed(mockEstimateId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('accept', () => {
    it('should accept a sent estimate', async () => {
      mockPrismaService.estimate.findFirst.mockResolvedValue({
        ...mockEstimate,
        status: EstimateStatus.SENT,
      });
      mockPrismaService.estimate.update.mockResolvedValue({
        ...mockEstimate,
        status: EstimateStatus.ACCEPTED,
        respondedAt: new Date(),
      });

      const result = await service.accept(mockEstimateId);

      expect(result.status).toBe(EstimateStatus.ACCEPTED);
      expect(result.respondedAt).toBeDefined();
    });

    it('should accept a viewed estimate', async () => {
      mockPrismaService.estimate.findFirst.mockResolvedValue({
        ...mockEstimate,
        status: EstimateStatus.VIEWED,
      });
      mockPrismaService.estimate.update.mockResolvedValue({
        ...mockEstimate,
        status: EstimateStatus.ACCEPTED,
        respondedAt: new Date(),
      });

      const result = await service.accept(mockEstimateId);

      expect(result.status).toBe(EstimateStatus.ACCEPTED);
    });

    it('should throw BadRequestException when estimate is draft', async () => {
      mockPrismaService.estimate.findFirst.mockResolvedValue(mockEstimate);

      await expect(service.accept(mockEstimateId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('reject', () => {
    it('should reject a sent estimate', async () => {
      mockPrismaService.estimate.findFirst.mockResolvedValue({
        ...mockEstimate,
        status: EstimateStatus.SENT,
      });
      mockPrismaService.estimate.update.mockResolvedValue({
        ...mockEstimate,
        status: EstimateStatus.REJECTED,
        respondedAt: new Date(),
      });

      const result = await service.reject(mockEstimateId);

      expect(result.status).toBe(EstimateStatus.REJECTED);
    });

    it('should throw BadRequestException when estimate is draft', async () => {
      mockPrismaService.estimate.findFirst.mockResolvedValue(mockEstimate);

      await expect(service.reject(mockEstimateId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('convertToJob', () => {
    it('should convert accepted estimate to job', async () => {
      const acceptedEstimate = {
        ...mockEstimate,
        status: EstimateStatus.ACCEPTED,
      };
      mockPrismaService.estimate.findFirst.mockResolvedValue(acceptedEstimate);
      mockPrismaService.job.create.mockResolvedValue({
        id: mockJobId,
        workspaceId: mockWorkspaceId,
        customerId: mockCustomerId,
        title: mockEstimate.title,
      });
      mockPrismaService.estimate.update.mockResolvedValue({
        ...acceptedEstimate,
        status: EstimateStatus.CONVERTED,
        convertedJobId: mockJobId,
        convertedJob: { id: mockJobId },
      });

      const result = await service.convertToJob(mockEstimateId);

      expect(result.status).toBe(EstimateStatus.CONVERTED);
      expect(result.convertedJobId).toBe(mockJobId);
      expect(mockPrismaService.job.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when estimate is not accepted', async () => {
      mockPrismaService.estimate.findFirst.mockResolvedValue({
        ...mockEstimate,
        status: EstimateStatus.SENT,
      });

      await expect(service.convertToJob(mockEstimateId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when estimate already converted', async () => {
      mockPrismaService.estimate.findFirst.mockResolvedValue({
        ...mockEstimate,
        status: EstimateStatus.ACCEPTED,
        convertedJobId: 'existing-job',
      });

      await expect(service.convertToJob(mockEstimateId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('delete', () => {
    it('should delete a draft estimate', async () => {
      mockPrismaService.estimate.findFirst.mockResolvedValue(mockEstimate);
      mockPrismaService.estimate.delete.mockResolvedValue(mockEstimate);

      await service.delete(mockEstimateId);

      expect(mockPrismaService.estimate.delete).toHaveBeenCalledWith({
        where: { id: mockEstimateId },
      });
    });

    it('should throw BadRequestException when estimate is not draft', async () => {
      mockPrismaService.estimate.findFirst.mockResolvedValue({
        ...mockEstimate,
        status: EstimateStatus.SENT,
      });

      await expect(service.delete(mockEstimateId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('checkExpiredEstimates', () => {
    it('should mark expired estimates', async () => {
      mockPrismaService.estimate.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.checkExpiredEstimates();

      expect(result).toBe(3);
      expect(mockPrismaService.estimate.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: {
              in: [EstimateStatus.SENT, EstimateStatus.VIEWED],
            },
          }),
          data: expect.objectContaining({
            status: EstimateStatus.EXPIRED,
          }),
        }),
      );
    });
  });
});

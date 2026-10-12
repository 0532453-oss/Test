import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import { PartService } from './part.service';

import { PrismaService } from '@/core/database/prisma.service';
import * as workspaceContext from '@/core/database/workspace-context';

describe('PartService', () => {
  let service: PartService;
  let prisma: PrismaService;

  const mockWorkspaceId = 'workspace-123';
  const mockPartId = 'part-123';
  const mockJobId = 'job-123';
  const mockJobPartId = 'job-part-123';

  const mockPart = {
    id: mockPartId,
    workspaceId: mockWorkspaceId,
    sku: 'HVAC-CAP-001',
    name: '30/5 MFD Dual Run Capacitor',
    description: 'Dual run capacitor for HVAC systems',
    category: 'HVAC',
    unitCost: new Prisma.Decimal('12.50'),
    unitPrice: new Prisma.Decimal('25.00'),
    quantityOnHand: 50,
    reorderPoint: 10,
    reorderQuantity: 20,
    isActive: true,
    syncStatus: 'PENDING',
    syncVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockJob = {
    id: mockJobId,
    workspaceId: mockWorkspaceId,
    customerId: 'customer-123',
    title: 'HVAC Repair',
    status: 'IN_PROGRESS',
  };

  const mockJobPart = {
    id: mockJobPartId,
    jobId: mockJobId,
    partId: mockPartId,
    quantity: new Prisma.Decimal('2'),
    unitPrice: new Prisma.Decimal('25.00'),
    total: new Prisma.Decimal('50.00'),
    notes: 'Replaced faulty capacitor',
    syncStatus: 'PENDING',
    syncVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    job: mockJob,
    part: mockPart,
  };

  const mockPrisma = {
    part: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      groupBy: jest.fn(),
      fields: {
        reorderPoint: 'reorderPoint',
      },
    },
    jobPart: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    job: {
      findFirst: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.spyOn(workspaceContext, 'getWorkspaceId').mockReturnValue(mockWorkspaceId);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PartService>(PartService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('createPart', () => {
    const createDto = {
      sku: 'HVAC-CAP-001',
      name: '30/5 MFD Dual Run Capacitor',
      description: 'Dual run capacitor for HVAC systems',
      category: 'HVAC',
      unitCost: 12.50,
      unitPrice: 25.00,
      quantityOnHand: 50,
    };

    it('should create a new part', async () => {
      mockPrisma.part.findFirst.mockResolvedValue(null);
      mockPrisma.part.create.mockResolvedValue(mockPart);

      const result = await service.createPart(createDto);

      expect(result).toEqual(mockPart);
      expect(mockPrisma.part.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          workspaceId: mockWorkspaceId,
          name: createDto.name,
          sku: createDto.sku,
        }),
      });
    });

    it('should throw ConflictException if SKU already exists', async () => {
      mockPrisma.part.findFirst.mockResolvedValue(mockPart);

      await expect(service.createPart(createDto)).rejects.toThrow(ConflictException);
    });

    it('should create part without SKU', async () => {
      const dtoWithoutSku = { ...createDto, sku: undefined };
      mockPrisma.part.create.mockResolvedValue({ ...mockPart, sku: null });

      const result = await service.createPart(dtoWithoutSku);

      expect(result).toBeDefined();
    });
  });

  describe('updatePart', () => {
    const updateDto = {
      name: 'Updated Capacitor Name',
      unitPrice: 30.00,
    };

    it('should update a part', async () => {
      mockPrisma.part.findFirst.mockResolvedValue(mockPart);
      const updatedPart = { ...mockPart, ...updateDto };
      mockPrisma.part.update.mockResolvedValue(updatedPart);

      const result = await service.updatePart(mockPartId, updateDto);

      expect(result.name).toEqual(updateDto.name);
    });

    it('should throw NotFoundException if part not found', async () => {
      mockPrisma.part.findFirst.mockResolvedValue(null);

      await expect(service.updatePart('non-existent', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if changing SKU to existing one', async () => {
      const existingPart = { ...mockPart, id: 'other-id', sku: 'EXISTING-SKU' };
      mockPrisma.part.findFirst
        .mockResolvedValueOnce(mockPart)
        .mockResolvedValueOnce(existingPart);

      await expect(
        service.updatePart(mockPartId, { sku: 'EXISTING-SKU' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getPartById', () => {
    it('should return a part by ID', async () => {
      mockPrisma.part.findFirst.mockResolvedValue(mockPart);

      const result = await service.getPartById(mockPartId);

      expect(result).toEqual(mockPart);
    });

    it('should throw NotFoundException if part not found', async () => {
      mockPrisma.part.findFirst.mockResolvedValue(null);

      await expect(service.getPartById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listParts', () => {
    it('should return all parts in workspace', async () => {
      const mockParts = [mockPart];
      mockPrisma.part.findMany.mockResolvedValue(mockParts);

      const result = await service.listParts();

      expect(result).toEqual(mockParts);
      expect(mockPrisma.part.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId: mockWorkspaceId },
        }),
      );
    });

    it('should filter by category', async () => {
      mockPrisma.part.findMany.mockResolvedValue([mockPart]);

      await service.listParts({ category: 'HVAC' });

      expect(mockPrisma.part.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workspaceId: mockWorkspaceId,
            category: 'HVAC',
          }),
        }),
      );
    });

    it('should filter by active status', async () => {
      mockPrisma.part.findMany.mockResolvedValue([mockPart]);

      await service.listParts({ isActive: true });

      expect(mockPrisma.part.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workspaceId: mockWorkspaceId,
            isActive: true,
          }),
        }),
      );
    });

    it('should filter by search term', async () => {
      mockPrisma.part.findMany.mockResolvedValue([mockPart]);

      await service.listParts({ search: 'capacitor' });

      expect(mockPrisma.part.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('getLowStockParts', () => {
    it('should return parts below reorder point', async () => {
      const lowStockPart = { ...mockPart, quantityOnHand: 5 };
      mockPrisma.$queryRaw.mockResolvedValue([lowStockPart]);

      const result = await service.getLowStockParts();

      expect(result).toContainEqual(lowStockPart);
    });
  });

  describe('adjustInventory', () => {
    it('should adjust inventory positively', async () => {
      mockPrisma.part.findFirst.mockResolvedValue(mockPart);
      const adjustedPart = { ...mockPart, quantityOnHand: 60 };
      mockPrisma.part.update.mockResolvedValue(adjustedPart);

      const result = await service.adjustInventory(mockPartId, 10, 'Received shipment');

      expect(result.quantityOnHand).toBe(60);
    });

    it('should adjust inventory negatively', async () => {
      mockPrisma.part.findFirst.mockResolvedValue(mockPart);
      const adjustedPart = { ...mockPart, quantityOnHand: 40 };
      mockPrisma.part.update.mockResolvedValue(adjustedPart);

      const result = await service.adjustInventory(mockPartId, -10, 'Manual adjustment');

      expect(result.quantityOnHand).toBe(40);
    });

    it('should throw BadRequestException for negative result', async () => {
      mockPrisma.part.findFirst.mockResolvedValue(mockPart);

      await expect(
        service.adjustInventory(mockPartId, -100, 'Invalid adjustment'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deletePart', () => {
    it('should soft delete part used in jobs', async () => {
      mockPrisma.part.findFirst.mockResolvedValue(mockPart);
      mockPrisma.jobPart.count.mockResolvedValue(5);
      const inactivePart = { ...mockPart, isActive: false };
      mockPrisma.part.update.mockResolvedValue(inactivePart);

      const result = await service.deletePart(mockPartId);

      expect(result.isActive).toBe(false);
    });

    it('should hard delete part never used', async () => {
      mockPrisma.part.findFirst.mockResolvedValue(mockPart);
      mockPrisma.jobPart.count.mockResolvedValue(0);
      mockPrisma.part.delete.mockResolvedValue(mockPart);

      const result = await service.deletePart(mockPartId);

      expect(mockPrisma.part.delete).toHaveBeenCalledWith({
        where: { id: mockPartId },
      });
    });
  });

  describe('getCategories', () => {
    it('should return unique categories', async () => {
      mockPrisma.part.groupBy.mockResolvedValue([
        { category: 'HVAC' },
        { category: 'Plumbing' },
        { category: 'Electrical' },
      ]);

      const result = await service.getCategories();

      expect(result).toEqual(['HVAC', 'Plumbing', 'Electrical']);
    });
  });

  describe('addPartToJob', () => {
    const addDto = {
      partId: mockPartId,
      quantity: 2,
      notes: 'Replaced faulty capacitor',
    };

    it('should add part to job and deduct inventory', async () => {
      mockPrisma.job.findFirst.mockResolvedValue(mockJob);
      mockPrisma.part.findFirst.mockResolvedValue(mockPart);
      mockPrisma.jobPart.findFirst.mockResolvedValue(null);
      mockPrisma.$transaction.mockResolvedValue([{ ...mockJobPart, part: mockPart }]);

      const result = await service.addPartToJob(mockJobId, addDto);

      expect(result).toBeDefined();
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if job not found', async () => {
      mockPrisma.job.findFirst.mockResolvedValue(null);

      await expect(service.addPartToJob('non-existent', addDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if part not found', async () => {
      mockPrisma.job.findFirst.mockResolvedValue(mockJob);
      mockPrisma.part.findFirst.mockResolvedValue(null);

      await expect(service.addPartToJob(mockJobId, addDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if part is inactive', async () => {
      mockPrisma.job.findFirst.mockResolvedValue(mockJob);
      mockPrisma.part.findFirst.mockResolvedValue({ ...mockPart, isActive: false });

      await expect(service.addPartToJob(mockJobId, addDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if part already on job', async () => {
      mockPrisma.job.findFirst.mockResolvedValue(mockJob);
      mockPrisma.part.findFirst.mockResolvedValue(mockPart);
      mockPrisma.jobPart.findFirst.mockResolvedValue(mockJobPart);

      await expect(service.addPartToJob(mockJobId, addDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if insufficient inventory', async () => {
      mockPrisma.job.findFirst.mockResolvedValue(mockJob);
      mockPrisma.part.findFirst.mockResolvedValue({ ...mockPart, quantityOnHand: 1 });
      mockPrisma.jobPart.findFirst.mockResolvedValue(null);

      await expect(
        service.addPartToJob(mockJobId, { ...addDto, quantity: 10 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use custom unit price if provided', async () => {
      mockPrisma.job.findFirst.mockResolvedValue(mockJob);
      mockPrisma.part.findFirst.mockResolvedValue(mockPart);
      mockPrisma.jobPart.findFirst.mockResolvedValue(null);
      mockPrisma.$transaction.mockResolvedValue([{ ...mockJobPart, unitPrice: new Prisma.Decimal('30.00') }]);

      const result = await service.addPartToJob(mockJobId, { ...addDto, unitPrice: 30.00 });

      expect(result).toBeDefined();
    });
  });

  describe('updateJobPart', () => {
    const updateDto = {
      quantity: 3,
      notes: 'Updated quantity',
    };

    it('should update job part', async () => {
      mockPrisma.jobPart.findFirst.mockResolvedValue(mockJobPart);
      const updatedJobPart = { ...mockJobPart, quantity: new Prisma.Decimal('3') };
      mockPrisma.$transaction.mockResolvedValue([updatedJobPart]);

      const result = await service.updateJobPart(mockJobPartId, updateDto);

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if job part not found', async () => {
      mockPrisma.jobPart.findFirst.mockResolvedValue(null);

      await expect(service.updateJobPart('non-existent', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if increasing quantity beyond inventory', async () => {
      mockPrisma.jobPart.findFirst.mockResolvedValue({
        ...mockJobPart,
        part: { ...mockPart, quantityOnHand: 1 },
      });

      await expect(
        service.updateJobPart(mockJobPartId, { quantity: 100 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removePartFromJob', () => {
    it('should remove part from job and return inventory', async () => {
      mockPrisma.jobPart.findFirst.mockResolvedValue(mockJobPart);
      mockPrisma.$transaction.mockResolvedValue([mockPart, mockJobPart]);

      await service.removePartFromJob(mockJobPartId);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if job part not found', async () => {
      mockPrisma.jobPart.findFirst.mockResolvedValue(null);

      await expect(service.removePartFromJob('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getJobParts', () => {
    it('should return all parts for a job', async () => {
      mockPrisma.job.findFirst.mockResolvedValue(mockJob);
      mockPrisma.jobPart.findMany.mockResolvedValue([mockJobPart]);

      const result = await service.getJobParts(mockJobId);

      expect(result).toContainEqual(mockJobPart);
    });

    it('should throw NotFoundException if job not found', async () => {
      mockPrisma.job.findFirst.mockResolvedValue(null);

      await expect(service.getJobParts('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getJobPartsTotals', () => {
    it('should calculate totals for job parts', async () => {
      mockPrisma.job.findFirst.mockResolvedValue(mockJob);
      mockPrisma.jobPart.findMany.mockResolvedValue([mockJobPart]);

      const result = await service.getJobPartsTotals(mockJobId);

      expect(result).toHaveProperty('jobId', mockJobId);
      expect(result).toHaveProperty('partsCount', 1);
      expect(result).toHaveProperty('totalCost');
      expect(result).toHaveProperty('totalPrice');
      expect(result).toHaveProperty('profit');
    });

    it('should return zero totals for job with no parts', async () => {
      mockPrisma.job.findFirst.mockResolvedValue(mockJob);
      mockPrisma.jobPart.findMany.mockResolvedValue([]);

      const result = await service.getJobPartsTotals(mockJobId);

      expect(result.partsCount).toBe(0);
      expect(result.totalCost).toBe(0);
      expect(result.totalPrice).toBe(0);
    });
  });

  describe('workspace context', () => {
    it('should throw BadRequestException when workspace context is missing', async () => {
      jest.spyOn(workspaceContext, 'getWorkspaceId').mockReturnValue(null as any);

      await expect(service.listParts()).rejects.toThrow(BadRequestException);
    });
  });
});

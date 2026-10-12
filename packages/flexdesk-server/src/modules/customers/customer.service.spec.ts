import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { SyncStatus } from '@prisma/client';

import { CustomerService } from './customer.service';

import { PrismaService } from '@/core/database/prisma.service';
import * as workspaceContext from '@/core/database/workspace-context';

describe('CustomerService', () => {
  let service: CustomerService;

  const mockWorkspaceId = 'workspace-123';
  const mockCustomerId = 'customer-123';

  const mockCustomer = {
    id: mockCustomerId,
    workspaceId: mockWorkspaceId,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    address: { street: '123 Main St', city: 'San Francisco' },
    syncStatus: SyncStatus.PENDING,
    syncVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    customer: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.spyOn(workspaceContext, 'getWorkspaceId').mockReturnValue(mockWorkspaceId);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCustomer', () => {
    it('should create a new customer', async () => {
      mockPrismaService.customer.create.mockResolvedValue(mockCustomer);

      const dto = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      };

      const result = await service.createCustomer(dto);

      expect(result).toEqual(mockCustomer);
      expect(mockPrismaService.customer.create).toHaveBeenCalled();
    });
  });

  describe('findAllCustomers', () => {
    it('should return all customers ordered by name', async () => {
      mockPrismaService.customer.findMany.mockResolvedValue([mockCustomer]);

      const result = await service.findAllCustomers();

      expect(result).toEqual([mockCustomer]);
      expect(mockPrismaService.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });
  });

  describe('findCustomerById', () => {
    it('should return a customer when found', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);

      const result = await service.findCustomerById(mockCustomerId);

      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(null);

      await expect(service.findCustomerById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateCustomer', () => {
    it('should update a customer', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrismaService.customer.update.mockResolvedValue({
        ...mockCustomer,
        name: 'Jane Doe',
      });

      const result = await service.updateCustomer(mockCustomerId, { name: 'Jane Doe' });

      expect(result.name).toBe('Jane Doe');
    });
  });

  describe('deleteCustomer', () => {
    it('should delete a customer', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrismaService.customer.delete.mockResolvedValue(mockCustomer);

      const result = await service.deleteCustomer(mockCustomerId);

      expect(result).toEqual(mockCustomer);
    });
  });

  describe('searchCustomers', () => {
    it('should search customers by name, email, or phone', async () => {
      mockPrismaService.customer.findMany.mockResolvedValue([mockCustomer]);

      const result = await service.searchCustomers('john');

      expect(result).toEqual([mockCustomer]);
      expect(mockPrismaService.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workspaceId: mockWorkspaceId,
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });
});

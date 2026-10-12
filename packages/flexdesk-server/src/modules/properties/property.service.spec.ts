import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { PropertyService } from './property.service';

import { PrismaService } from '@/core/database/prisma.service';
import * as workspaceContext from '@/core/database/workspace-context';

describe('PropertyService', () => {
  let service: PropertyService;
  let prisma: PrismaService;

  const mockWorkspaceId = 'workspace-123';
  const mockCustomerId = 'customer-123';
  const mockPropertyId = 'property-123';

  const mockCustomer = {
    id: mockCustomerId,
    workspaceId: mockWorkspaceId,
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '555-1234',
    address: { street: '123 Main St', city: 'Test City', state: 'TS', zip: '12345' },
  };

  const mockProperty = {
    id: mockPropertyId,
    workspaceId: mockWorkspaceId,
    customerId: mockCustomerId,
    name: 'Main Office',
    isPrimary: true,
    street: '456 Oak Ave',
    street2: 'Suite 100',
    city: 'Tech City',
    state: 'TC',
    zip: '54321',
    country: 'US',
    lat: 37.7749,
    lng: -122.4194,
    accessNotes: 'Ring buzzer 101',
    serviceNotes: 'Equipment in back room',
    syncStatus: 'PENDING',
    syncVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    property: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
    },
    job: {
      count: jest.fn(),
    },
    recurringJobTemplate: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.spyOn(workspaceContext, 'getWorkspaceId').mockReturnValue(mockWorkspaceId);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PropertyService>(PropertyService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('createProperty', () => {
    const createDto = {
      customerId: mockCustomerId,
      name: 'Main Office',
      isPrimary: true,
      street: '456 Oak Ave',
      city: 'Tech City',
      state: 'TC',
      zip: '54321',
    };

    it('should create a new property', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrisma.property.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.property.create.mockResolvedValue(mockProperty);

      const result = await service.createProperty(createDto);

      expect(result).toEqual(mockProperty);
      expect(mockPrisma.customer.findFirst).toHaveBeenCalledWith({
        where: { id: mockCustomerId, workspaceId: mockWorkspaceId },
      });
    });

    it('should unset other primary properties when creating a primary property', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrisma.property.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.property.create.mockResolvedValue(mockProperty);

      await service.createProperty({ ...createDto, isPrimary: true });

      expect(mockPrisma.property.updateMany).toHaveBeenCalledWith({
        where: { customerId: mockCustomerId, workspaceId: mockWorkspaceId, isPrimary: true },
        data: { isPrimary: false },
      });
    });

    it('should throw NotFoundException if customer not found', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      await expect(service.createProperty(createDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllProperties', () => {
    it('should return all properties in workspace', async () => {
      const mockProperties = [mockProperty];
      mockPrisma.property.findMany.mockResolvedValue(mockProperties);

      const result = await service.findAllProperties();

      expect(result).toEqual(mockProperties);
      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId: mockWorkspaceId },
        }),
      );
    });
  });

  describe('findPropertiesByCustomer', () => {
    it('should return properties for a specific customer', async () => {
      const mockProperties = [mockProperty];
      mockPrisma.property.findMany.mockResolvedValue(mockProperties);

      const result = await service.findPropertiesByCustomer(mockCustomerId);

      expect(result).toEqual(mockProperties);
      expect(mockPrisma.property.findMany).toHaveBeenCalledWith({
        where: { customerId: mockCustomerId, workspaceId: mockWorkspaceId },
        orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
      });
    });
  });

  describe('findPropertyById', () => {
    it('should return a property by ID', async () => {
      mockPrisma.property.findFirst.mockResolvedValue(mockProperty);

      const result = await service.findPropertyById(mockPropertyId);

      expect(result).toEqual(mockProperty);
    });

    it('should throw NotFoundException if property not found', async () => {
      mockPrisma.property.findFirst.mockResolvedValue(null);

      await expect(service.findPropertyById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPrimaryProperty', () => {
    it('should return the primary property for a customer', async () => {
      mockPrisma.property.findFirst.mockResolvedValue(mockProperty);

      const result = await service.getPrimaryProperty(mockCustomerId);

      expect(result).toEqual(mockProperty);
      expect(mockPrisma.property.findFirst).toHaveBeenCalledWith({
        where: { customerId: mockCustomerId, workspaceId: mockWorkspaceId, isPrimary: true },
      });
    });

    it('should return null if no primary property exists', async () => {
      mockPrisma.property.findFirst.mockResolvedValue(null);

      const result = await service.getPrimaryProperty(mockCustomerId);

      expect(result).toBeNull();
    });
  });

  describe('updateProperty', () => {
    const updateDto = {
      name: 'Updated Name',
      city: 'New City',
    };

    it('should update a property', async () => {
      mockPrisma.property.findFirst.mockResolvedValue(mockProperty);
      const updatedProperty = { ...mockProperty, ...updateDto };
      mockPrisma.property.update.mockResolvedValue(updatedProperty);

      const result = await service.updateProperty(mockPropertyId, updateDto);

      expect(result).toEqual(updatedProperty);
    });

    it('should unset other primaries when setting isPrimary to true', async () => {
      mockPrisma.property.findFirst.mockResolvedValue(mockProperty);
      mockPrisma.property.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.property.update.mockResolvedValue({ ...mockProperty, isPrimary: true });

      await service.updateProperty(mockPropertyId, { isPrimary: true });

      expect(mockPrisma.property.updateMany).toHaveBeenCalled();
    });
  });

  describe('setPrimaryProperty', () => {
    it('should set a property as primary', async () => {
      mockPrisma.property.findFirst.mockResolvedValue({ ...mockProperty, isPrimary: false });
      mockPrisma.property.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.property.update.mockResolvedValue({ ...mockProperty, isPrimary: true });

      const result = await service.setPrimaryProperty(mockPropertyId);

      expect(result.isPrimary).toBe(true);
      expect(mockPrisma.property.updateMany).toHaveBeenCalledWith({
        where: {
          customerId: mockCustomerId,
          workspaceId: mockWorkspaceId,
          isPrimary: true,
        },
        data: { isPrimary: false },
      });
    });
  });

  describe('deleteProperty', () => {
    it('should delete a property with no references', async () => {
      mockPrisma.property.findFirst.mockResolvedValue(mockProperty);
      mockPrisma.job.count.mockResolvedValue(0);
      mockPrisma.recurringJobTemplate.count.mockResolvedValue(0);
      mockPrisma.property.delete.mockResolvedValue(mockProperty);

      const result = await service.deleteProperty(mockPropertyId);

      expect(result).toEqual(mockProperty);
    });

    it('should throw BadRequestException if property has jobs', async () => {
      mockPrisma.property.findFirst.mockResolvedValue(mockProperty);
      mockPrisma.job.count.mockResolvedValue(5);

      await expect(service.deleteProperty(mockPropertyId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if property has recurring templates', async () => {
      mockPrisma.property.findFirst.mockResolvedValue(mockProperty);
      mockPrisma.job.count.mockResolvedValue(0);
      mockPrisma.recurringJobTemplate.count.mockResolvedValue(3);

      await expect(service.deleteProperty(mockPropertyId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('searchProperties', () => {
    it('should search properties by name or address', async () => {
      const mockProperties = [mockProperty];
      mockPrisma.property.findMany.mockResolvedValue(mockProperties);

      const result = await service.searchProperties('Oak');

      expect(result).toEqual(mockProperties);
      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workspaceId: mockWorkspaceId,
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('migrateCustomerAddressToProperty', () => {
    it('should migrate legacy address to a property', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrisma.property.findFirst.mockResolvedValue(null); // No existing properties
      mockPrisma.property.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.property.create.mockResolvedValue(mockProperty);

      const result = await service.migrateCustomerAddressToProperty(mockCustomerId);

      expect(result).toEqual(mockProperty);
    });

    it('should return null if customer has no legacy address', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue({ ...mockCustomer, address: null });

      const result = await service.migrateCustomerAddressToProperty(mockCustomerId);

      expect(result).toBeNull();
    });

    it('should return null if customer already has properties', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrisma.property.findFirst.mockResolvedValue(mockProperty);

      const result = await service.migrateCustomerAddressToProperty(mockCustomerId);

      expect(result).toBeNull();
    });

    it('should throw NotFoundException if customer not found', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.migrateCustomerAddressToProperty('non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

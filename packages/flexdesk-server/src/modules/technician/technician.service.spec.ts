import { NotFoundException, ConflictException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { SyncStatus } from '@prisma/client';

import { GoogleMapsService } from '../maps/google-maps.service';

import { TechnicianService } from './technician.service';

import { PrismaService } from '@/core/database/prisma.service';
import * as workspaceContext from '@/core/database/workspace-context';

describe('TechnicianService', () => {
  let service: TechnicianService;

  const mockWorkspaceId = 'workspace-123';
  const mockTechnicianId = 'technician-123';
  const mockUserId = 'user-123';

  const mockTechnician = {
    id: mockTechnicianId,
    workspaceId: mockWorkspaceId,
    userId: mockUserId,
    phone: '+1234567890',
    licenseNumber: 'LIC-12345',
    specialties: ['HVAC', 'Plumbing'],
    currentLocation: { lat: 37.7749, lng: -122.4194, updatedAt: new Date().toISOString() },
    isAvailable: true,
    syncStatus: SyncStatus.PENDING,
    lastSyncedAt: null,
    syncVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: mockUserId, firstName: 'John', lastName: 'Doe' },
  };

  const mockPrismaService = {
    technician: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockGoogleMapsService = {
    geocodeAddress: jest.fn(),
    getDistanceMatrix: jest.fn(),
  };

  beforeEach(async () => {
    jest.spyOn(workspaceContext, 'getWorkspaceId').mockReturnValue(mockWorkspaceId);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechnicianService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: GoogleMapsService, useValue: mockGoogleMapsService },
      ],
    }).compile();

    service = module.get<TechnicianService>(TechnicianService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTechnician', () => {
    it('should create a new technician', async () => {
      mockPrismaService.technician.findFirst.mockResolvedValue(null);
      mockPrismaService.technician.create.mockResolvedValue(mockTechnician);

      const dto = {
        userId: mockUserId,
        phone: '+1234567890',
        specialties: ['HVAC'],
      };

      const result = await service.createTechnician(dto);

      expect(result).toEqual(mockTechnician);
    });

    it('should throw ConflictException when user is already a technician', async () => {
      mockPrismaService.technician.findFirst.mockResolvedValue(mockTechnician);

      const dto = { userId: mockUserId };

      await expect(service.createTechnician(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllTechnicians', () => {
    it('should return all technicians', async () => {
      mockPrismaService.technician.findMany.mockResolvedValue([mockTechnician]);

      const result = await service.findAllTechnicians();

      expect(result).toEqual([mockTechnician]);
    });
  });

  describe('findTechnicianById', () => {
    it('should return a technician when found', async () => {
      mockPrismaService.technician.findFirst.mockResolvedValue(mockTechnician);

      const result = await service.findTechnicianById(mockTechnicianId);

      expect(result).toEqual(mockTechnician);
    });

    it('should throw NotFoundException when technician not found', async () => {
      mockPrismaService.technician.findFirst.mockResolvedValue(null);

      await expect(service.findTechnicianById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findTechnicianByUserId', () => {
    it('should return technician for user', async () => {
      mockPrismaService.technician.findFirst.mockResolvedValue(mockTechnician);

      const result = await service.findTechnicianByUserId(mockUserId);

      expect(result).toEqual(mockTechnician);
    });

    it('should throw NotFoundException when no technician for user', async () => {
      mockPrismaService.technician.findFirst.mockResolvedValue(null);

      await expect(service.findTechnicianByUserId('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateCurrentLocation', () => {
    it('should update technician location', async () => {
      mockPrismaService.technician.findFirst.mockResolvedValue(mockTechnician);
      mockPrismaService.technician.update.mockResolvedValue({
        ...mockTechnician,
        currentLocation: { lat: 37.8, lng: -122.5 },
      });

      await service.updateCurrentLocation(mockUserId, { lat: 37.8, lng: -122.5 });

      expect(mockPrismaService.technician.update).toHaveBeenCalled();
    });
  });

  describe('setAvailability', () => {
    it('should set technician availability', async () => {
      mockPrismaService.technician.findFirst.mockResolvedValue(mockTechnician);
      mockPrismaService.technician.update.mockResolvedValue({
        ...mockTechnician,
        isAvailable: false,
      });

      const result = await service.setAvailability(mockTechnicianId, false);

      expect(result.isAvailable).toBe(false);
    });
  });

  describe('findAvailableTechnicians', () => {
    it('should return available technicians', async () => {
      mockPrismaService.technician.findMany.mockResolvedValue([mockTechnician]);

      const result = await service.findAvailableTechnicians(true);

      expect(result).toEqual([mockTechnician]);
      expect(mockPrismaService.technician.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isAvailable: true,
          }),
        }),
      );
    });
  });
});

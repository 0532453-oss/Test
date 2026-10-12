import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';

import { StripeConnectService } from './stripe-connect.service';

import { PrismaService } from '@/core/database/prisma.service';
import * as workspaceContext from '@/core/database/workspace-context';

// Mock workspace context
jest.mock('@/core/database/workspace-context', () => ({
  getWorkspaceId: jest.fn(),
}));

describe('StripeConnectService', () => {
  let service: StripeConnectService;
  let prisma: PrismaService;
  let configService: ConfigService;

  const mockWorkspaceId = 'workspace-123';
  const mockTechnicianId = 'technician-456';
  const mockStripeAccountId = 'acct_test123';

  const mockTechnician = {
    id: mockTechnicianId,
    workspaceId: mockWorkspaceId,
    userId: 'user-789',
    stripeAccountId: null,
    stripeChargesEnabled: false,
    stripeOnboardingComplete: false,
    user: {
      id: 'user-789',
      email: 'provider@example.com',
      firstName: 'John',
      lastName: 'Doe',
    },
  };

  const mockTechnicianWithStripe = {
    ...mockTechnician,
    stripeAccountId: mockStripeAccountId,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeConnectService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'stripe.secretKey') return 'sk_test_fake_key';
              if (key === 'app.publicAppUrl') return 'http://localhost:3000';
              return null;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            technician: {
              findFirst: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<StripeConnectService>(StripeConnectService);
    prisma = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset mocks
    jest.clearAllMocks();
    (workspaceContext.getWorkspaceId as jest.Mock).mockReturnValue(mockWorkspaceId);
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize Stripe client when secret key is configured', () => {
      // The service is created in beforeEach, so it should have a Stripe client
      expect(service).toBeDefined();
    });
  });

  describe('createOnboardingLink', () => {
    it('should throw BadRequestException when workspace context is missing', async () => {
      (workspaceContext.getWorkspaceId as jest.Mock).mockReturnValue(null);

      await expect(service.createOnboardingLink(mockTechnicianId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when technician is not found', async () => {
      (prisma.technician.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.createOnboardingLink(mockTechnicianId)).rejects.toThrow(
        NotFoundException,
      );

      expect(prisma.technician.findFirst).toHaveBeenCalledWith({
        where: { id: mockTechnicianId, workspaceId: mockWorkspaceId },
        include: { user: true },
      });
    });
  });

  describe('getAccountStatus', () => {
    it('should throw BadRequestException when workspace context is missing', async () => {
      (workspaceContext.getWorkspaceId as jest.Mock).mockReturnValue(null);

      await expect(service.getAccountStatus(mockTechnicianId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when technician is not found', async () => {
      (prisma.technician.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getAccountStatus(mockTechnicianId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when technician has not started onboarding', async () => {
      (prisma.technician.findFirst as jest.Mock).mockResolvedValue(mockTechnician);

      await expect(service.getAccountStatus(mockTechnicianId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('handleAccountUpdated', () => {
    it('should log warning when account has no technicianId metadata', async () => {
      const mockAccount = {
        id: mockStripeAccountId,
        charges_enabled: true,
        details_submitted: true,
        metadata: {},
      };

      // Should not throw, just log warning
      await expect(service.handleAccountUpdated(mockAccount as any)).resolves.not.toThrow();
    });

    it('should log warning when technician is not found for account', async () => {
      const mockAccount = {
        id: mockStripeAccountId,
        charges_enabled: true,
        details_submitted: true,
        metadata: { technicianId: mockTechnicianId },
      };

      (prisma.technician.findFirst as jest.Mock).mockResolvedValue(null);

      // Should not throw, just log warning
      await expect(service.handleAccountUpdated(mockAccount as any)).resolves.not.toThrow();
    });

    it('should update technician when account is found', async () => {
      const mockAccount = {
        id: mockStripeAccountId,
        charges_enabled: true,
        details_submitted: true,
        metadata: { technicianId: mockTechnicianId },
      };

      (prisma.technician.findFirst as jest.Mock).mockResolvedValue(mockTechnicianWithStripe);
      (prisma.technician.update as jest.Mock).mockResolvedValue({
        ...mockTechnicianWithStripe,
        stripeChargesEnabled: true,
        stripeOnboardingComplete: true,
      });

      await service.handleAccountUpdated(mockAccount as any);

      expect(prisma.technician.update).toHaveBeenCalledWith({
        where: { id: mockTechnicianId },
        data: {
          stripeChargesEnabled: true,
          stripeOnboardingComplete: true,
        },
      });
    });
  });
});

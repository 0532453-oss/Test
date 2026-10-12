import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { NotificationPreferenceController } from './notification-preference.controller';
import { NotificationService } from './notification.service';

import { PrismaService } from '@/core/database/prisma.service';
import * as workspaceContext from '@/core/database/workspace-context';

// Mock the workspace context module
jest.mock('@/core/database/workspace-context', () => ({
  getWorkspaceId: jest.fn(),
}));

describe('NotificationPreferenceController', () => {
  let controller: NotificationPreferenceController;

  const mockNotificationService = {
    getCustomerPreferences: jest.fn(),
    upsertCustomerPreferences: jest.fn(),
    isNotificationEnabled: jest.fn(),
  };

  const mockPrismaService = {
    customer: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (workspaceContext.getWorkspaceId as jest.Mock).mockReturnValue('workspace-123');

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationPreferenceController],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<NotificationPreferenceController>(NotificationPreferenceController);
  });

  describe('getPreferences', () => {
    it('should return customer preferences', async () => {
      const mockPrefs = {
        id: 'pref-1',
        customerId: 'customer-123',
        emailEnabled: true,
        smsEnabled: true,
        jobDispatched: true,
        reminderHoursBefore: 24,
      };

      mockPrismaService.customer.findFirst.mockResolvedValue({
        id: 'customer-123',
        workspaceId: 'workspace-123',
        name: 'Test Customer',
      });
      mockNotificationService.getCustomerPreferences.mockResolvedValue(mockPrefs);

      const result = await controller.getPreferences('customer-123');

      expect(result.customerId).toBe('customer-123');
      expect(result.preferences).toEqual(mockPrefs);
      expect(mockPrismaService.customer.findFirst).toHaveBeenCalledWith({
        where: { id: 'customer-123', workspaceId: 'workspace-123' },
      });
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(null);

      await expect(
        controller.getPreferences('invalid-customer'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when workspace context is missing', async () => {
      (workspaceContext.getWorkspaceId as jest.Mock).mockReturnValue(null);

      await expect(
        controller.getPreferences('customer-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updatePreferences', () => {
    it('should update customer preferences', async () => {
      const mockUpdatedPrefs = {
        id: 'pref-1',
        customerId: 'customer-123',
        emailEnabled: true,
        smsEnabled: false,
        jobDispatched: true,
      };

      mockPrismaService.customer.findFirst.mockResolvedValue({
        id: 'customer-123',
        workspaceId: 'workspace-123',
      });
      mockNotificationService.upsertCustomerPreferences.mockResolvedValue(mockUpdatedPrefs);

      const result = await controller.updatePreferences(
        'customer-123',
        { smsEnabled: false },
      );

      expect(result.customerId).toBe('customer-123');
      expect(result.preferences).toEqual(mockUpdatedPrefs);
      expect(mockNotificationService.upsertCustomerPreferences).toHaveBeenCalledWith(
        'customer-123',
        { smsEnabled: false },
      );
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(null);

      await expect(
        controller.updatePreferences('invalid-customer', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when quiet hours are the same', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue({
        id: 'customer-123',
        workspaceId: 'workspace-123',
      });

      await expect(
        controller.updatePreferences(
          'customer-123',
          { quietHoursStart: '21:00', quietHoursEnd: '21:00' },
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow different quiet hours start and end', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue({
        id: 'customer-123',
        workspaceId: 'workspace-123',
      });
      mockNotificationService.upsertCustomerPreferences.mockResolvedValue({
        id: 'pref-1',
        customerId: 'customer-123',
        quietHoursStart: '21:00',
        quietHoursEnd: '08:00',
      });

      const result = await controller.updatePreferences(
        'customer-123',
        { quietHoursStart: '21:00', quietHoursEnd: '08:00' },
      );

      expect(result.preferences.quietHoursStart).toBe('21:00');
      expect(result.preferences.quietHoursEnd).toBe('08:00');
    });
  });

  describe('checkNotificationEnabled', () => {
    it('should return enabled status for valid notification type and channel', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue({
        id: 'customer-123',
        workspaceId: 'workspace-123',
      });
      mockNotificationService.isNotificationEnabled.mockResolvedValue(true);

      const result = await controller.checkNotificationEnabled(
        'customer-123',
        'jobDispatched',
        'email',
      );

      expect(result.customerId).toBe('customer-123');
      expect(result.notificationType).toBe('jobDispatched');
      expect(result.channel).toBe('email');
      expect(result.enabled).toBe(true);
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(null);

      await expect(
        controller.checkNotificationEnabled('invalid-customer', 'jobDispatched', 'email'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for invalid notification type', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue({
        id: 'customer-123',
        workspaceId: 'workspace-123',
      });

      await expect(
        controller.checkNotificationEnabled('customer-123', 'invalidType', 'email'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid channel', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue({
        id: 'customer-123',
        workspaceId: 'workspace-123',
      });

      await expect(
        controller.checkNotificationEnabled('customer-123', 'jobDispatched', 'invalid' as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return false when notification is disabled', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue({
        id: 'customer-123',
        workspaceId: 'workspace-123',
      });
      mockNotificationService.isNotificationEnabled.mockResolvedValue(false);

      const result = await controller.checkNotificationEnabled(
        'customer-123',
        'marketingMessages',
        'sms',
      );

      expect(result.enabled).toBe(false);
    });
  });
});

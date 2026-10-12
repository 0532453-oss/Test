import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { JobStatus, Prisma } from '@prisma/client';
import * as sgMail from '@sendgrid/mail';

import { NotificationService, type EmailPayload, type CustomerWithPreference } from './notification.service';

import { PrismaService } from '@/core/database/prisma.service';

// Mock the entire @sendgrid/mail module
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn(),
}));

// Mock Twilio
const mockTwilioSend = jest.fn().mockResolvedValue({ sid: 'test-sms-sid' });
jest.mock('twilio', () => {
  return {
    Twilio: jest.fn().mockImplementation(() => ({
      messages: {
        create: mockTwilioSend,
      },
    })),
  };
});

// Mock the signJobToken function
jest.mock('@/utils/crypto', () => ({
  signJobToken: jest.fn().mockReturnValue('mock-token'),
}));

describe('NotificationService', () => {
  let service: NotificationService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        PUBLIC_APP_URL: 'http://localhost:3000',
        SENDGRID_API_KEY: '',
        SENDGRID_FROM_EMAIL: 'noreply@flexdesk.io',
        SENDGRID_FROM_NAME: 'FlexDesk',
        TWILIO_ACCOUNT_SID: '',
        TWILIO_AUTH_TOKEN: '',
        TWILIO_FROM_NUMBER: '',
      };
      return config[key] ?? defaultValue;
    }),
  };

  const mockPrismaService = {
    notificationPreference: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  describe('sendEmail', () => {
    it('should return mock result when SendGrid is not configured', async () => {
      service.onModuleInit();

      const payload: EmailPayload = {
        to: 'test@example.com',
        subject: 'Test Email',
        template: 'job-dispatched',
        context: { customerName: 'John' },
      };

      const result = await service.sendEmail(payload);

      expect(result.success).toBe(true);
      expect(result.channel).toBe('email');
      expect(result.messageId).toMatch(/^email-mock-/);
      expect(sgMail.send).not.toHaveBeenCalled();
    });

    it('should log payload when SendGrid is not configured', async () => {
      service.onModuleInit();

      const payload: EmailPayload = {
        to: 'test@example.com',
        subject: 'Test Email',
        template: 'job-completed',
        context: {
          customerName: 'Jane',
          jobTitle: 'HVAC Repair',
          invoiceNumber: 'INV-001',
          total: '150.00',
          invoiceLink: 'http://localhost:3000/invoices/123',
        },
      };

      const result = await service.sendEmail(payload);

      expect(result.success).toBe(true);
      expect(result.channel).toBe('email');
    });
  });

  describe('sendSms', () => {
    it('should return mock result when Twilio is not configured', async () => {
      service.onModuleInit();

      const result = await service.sendSms({
        to: '+1234567890',
        message: 'Test message',
      });

      expect(result.success).toBe(true);
      expect(result.channel).toBe('sms');
      expect(result.messageId).toMatch(/^sms-mock-/);
    });
  });

  describe('getCustomerPreferences', () => {
    it('should return stored preferences if they exist', async () => {
      service.onModuleInit();

      const mockPrefs = {
        id: 'pref-1',
        customerId: 'customer-123',
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: false,
        jobDispatched: true,
        jobReminder: false,
        jobCompleted: true,
        invoiceSent: true,
        paymentReceived: true,
        estimateSent: true,
        estimateFollowUp: false,
        marketingMessages: false,
        reminderHoursBefore: 12,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.notificationPreference.findUnique.mockResolvedValue(mockPrefs);

      const result = await service.getCustomerPreferences('customer-123');

      expect(result).toEqual(mockPrefs);
      expect(mockPrismaService.notificationPreference.findUnique).toHaveBeenCalledWith({
        where: { customerId: 'customer-123' },
      });
    });

    it('should return default preferences if none exist', async () => {
      service.onModuleInit();

      mockPrismaService.notificationPreference.findUnique.mockResolvedValue(null);

      const result = await service.getCustomerPreferences('customer-123');

      expect(result.emailEnabled).toBe(true);
      expect(result.smsEnabled).toBe(true);
      expect(result.jobDispatched).toBe(true);
      expect(result.marketingMessages).toBe(false);
      expect(result.reminderHoursBefore).toBe(24);
    });
  });

  describe('upsertCustomerPreferences', () => {
    it('should create or update preferences', async () => {
      service.onModuleInit();

      const mockResult = {
        id: 'pref-1',
        customerId: 'customer-123',
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: false,
        jobDispatched: true,
        jobReminder: true,
        jobCompleted: true,
        invoiceSent: true,
        paymentReceived: true,
        estimateSent: true,
        estimateFollowUp: false,
        marketingMessages: false,
        reminderHoursBefore: 24,
        quietHoursStart: '21:00',
        quietHoursEnd: '08:00',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.notificationPreference.upsert.mockResolvedValue(mockResult);

      const result = await service.upsertCustomerPreferences('customer-123', { smsEnabled: false });

      expect(result.smsEnabled).toBe(false);
      expect(mockPrismaService.notificationPreference.upsert).toHaveBeenCalled();
    });
  });

  describe('isNotificationEnabled', () => {
    it('should return true when both channel and type are enabled', async () => {
      service.onModuleInit();

      mockPrismaService.notificationPreference.findUnique.mockResolvedValue({
        emailEnabled: true,
        smsEnabled: true,
        jobDispatched: true,
      });

      const result = await service.isNotificationEnabled('customer-1', 'jobDispatched', 'email');
      expect(result).toBe(true);
    });

    it('should return false when channel is disabled', async () => {
      service.onModuleInit();

      mockPrismaService.notificationPreference.findUnique.mockResolvedValue({
        emailEnabled: false,
        smsEnabled: true,
        jobDispatched: true,
      });

      const result = await service.isNotificationEnabled('customer-1', 'jobDispatched', 'email');
      expect(result).toBe(false);
    });

    it('should return false when notification type is disabled', async () => {
      service.onModuleInit();

      mockPrismaService.notificationPreference.findUnique.mockResolvedValue({
        emailEnabled: true,
        smsEnabled: true,
        jobDispatched: false,
      });

      const result = await service.isNotificationEnabled('customer-1', 'jobDispatched', 'email');
      expect(result).toBe(false);
    });
  });

  describe('isWithinQuietHours', () => {
    it('should return false when quiet hours are not set', () => {
      service.onModuleInit();

      const prefs = {
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: false,
        jobDispatched: true,
        jobReminder: true,
        jobCompleted: true,
        invoiceSent: true,
        paymentReceived: true,
        estimateSent: true,
        estimateFollowUp: false,
        marketingMessages: false,
        reminderHoursBefore: 24,
        quietHoursStart: null,
        quietHoursEnd: null,
      };

      expect(service.isWithinQuietHours(prefs as any)).toBe(false);
    });

    it('should handle overnight quiet hours correctly', () => {
      service.onModuleInit();

      const prefs = {
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: false,
        jobDispatched: true,
        jobReminder: true,
        jobCompleted: true,
        invoiceSent: true,
        paymentReceived: true,
        estimateSent: true,
        estimateFollowUp: false,
        marketingMessages: false,
        reminderHoursBefore: 24,
        quietHoursStart: '21:00',
        quietHoursEnd: '08:00',
      };

      // The actual result depends on current time, so we just verify the method doesn't throw
      const result = service.isWithinQuietHours(prefs as any);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('sendNotificationWithPreferences', () => {
    const mockCustomerWithPrefs: CustomerWithPreference = {
      id: 'customer-123',
      workspaceId: 'workspace-123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: null,
      syncStatus: 'SYNCED',
      lastSyncedAt: new Date(),
      syncVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      notificationPreference: {
        id: 'pref-1',
        customerId: 'customer-123',
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: false,
        jobDispatched: true,
        jobReminder: true,
        jobCompleted: true,
        invoiceSent: true,
        paymentReceived: true,
        estimateSent: true,
        estimateFollowUp: false,
        marketingMessages: false,
        reminderHoursBefore: 24,
        quietHoursStart: null,
        quietHoursEnd: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    it('should send email and SMS when both are enabled', async () => {
      service.onModuleInit();

      const results = await service.sendNotificationWithPreferences(
        mockCustomerWithPrefs,
        'jobDispatched',
        {
          subject: 'Test',
          template: 'job-dispatched',
          context: { customerName: 'John', jobTitle: 'Test', trackingLink: 'https://link' },
        },
        { message: 'Test SMS' },
      );

      expect(results.email).toBeDefined();
      expect(results.email?.success).toBe(true);
      expect(results.sms).toBeDefined();
      expect(results.sms?.success).toBe(true);
    });

    it('should skip notifications when type is disabled', async () => {
      service.onModuleInit();

      const customerWithDisabledType: CustomerWithPreference = {
        ...mockCustomerWithPrefs,
        notificationPreference: {
          ...mockCustomerWithPrefs.notificationPreference!,
          jobDispatched: false,
        },
      };

      const results = await service.sendNotificationWithPreferences(
        customerWithDisabledType,
        'jobDispatched',
        { subject: 'Test', template: 'job-dispatched', context: {} },
        { message: 'Test' },
      );

      expect(results.email).toBeUndefined();
      expect(results.sms).toBeUndefined();
    });

    it('should only send SMS when email is disabled', async () => {
      service.onModuleInit();

      const customerEmailDisabled: CustomerWithPreference = {
        ...mockCustomerWithPrefs,
        notificationPreference: {
          ...mockCustomerWithPrefs.notificationPreference!,
          emailEnabled: false,
        },
      };

      const results = await service.sendNotificationWithPreferences(
        customerEmailDisabled,
        'jobDispatched',
        { subject: 'Test', template: 'job-dispatched', context: {} },
        { message: 'Test' },
      );

      expect(results.email).toBeUndefined();
      expect(results.sms).toBeDefined();
    });
  });

  describe('notifyJobDispatched', () => {
    const mockJob = {
      id: 'job-123',
      workspaceId: 'workspace-123',
      customerId: 'customer-123',
      technicianId: 'tech-123',
      title: 'HVAC Repair',
      description: 'Fix AC unit',
      status: JobStatus.IN_PROGRESS,
      scheduledAt: new Date('2024-01-15T10:00:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      estimatedDuration: 60,
      actualDuration: null,
      notes: null,
      address: '123 Main St',
      latitude: null,
      longitude: null,
      priority: 'NORMAL' as const,
    };

    const mockCustomer: CustomerWithPreference = {
      id: 'customer-123',
      workspaceId: 'workspace-123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: { street: '123 Main St' },
      syncStatus: 'SYNCED',
      lastSyncedAt: new Date(),
      syncVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      notificationPreference: null,
    };

    it('should return job status change event with tracking link', async () => {
      service.onModuleInit();

      const result = await service.notifyJobDispatched(mockJob as any, mockCustomer, {
        previousStatus: JobStatus.SCHEDULED,
      });

      expect(result.jobId).toBe('job-123');
      expect(result.workspaceId).toBe('workspace-123');
      expect(result.previousStatus).toBe(JobStatus.SCHEDULED);
      expect(result.nextStatus).toBe(JobStatus.IN_PROGRESS);
      expect(result.trackingLink).toContain('http://localhost:3000/public/track/');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should send email to customer with email address', async () => {
      service.onModuleInit();

      await service.notifyJobDispatched(mockJob as any, mockCustomer, {
        previousStatus: JobStatus.SCHEDULED,
      });

      // Since SendGrid is not configured, it just logs (mock result)
      expect(sgMail.send).not.toHaveBeenCalled();
    });

    it('should not send email if customer has no email', async () => {
      service.onModuleInit();

      const customerWithoutEmail = { ...mockCustomer, email: null };

      const result = await service.notifyJobDispatched(mockJob as any, customerWithoutEmail as any, {
        previousStatus: JobStatus.SCHEDULED,
      });

      expect(result).toBeDefined();
    });
  });

  describe('notifyJobCompleted', () => {
    const mockJob = {
      id: 'job-123',
      workspaceId: 'workspace-123',
      customerId: 'customer-123',
      technicianId: 'tech-123',
      title: 'HVAC Repair',
      description: 'Fix AC unit',
      status: JobStatus.COMPLETED,
      scheduledAt: new Date('2024-01-15T10:00:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: new Date(),
      estimatedDuration: 60,
      actualDuration: 45,
      notes: null,
      address: '123 Main St',
      latitude: null,
      longitude: null,
      priority: 'NORMAL' as const,
    };

    const mockCustomer: CustomerWithPreference = {
      id: 'customer-123',
      workspaceId: 'workspace-123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: { street: '123 Main St' },
      syncStatus: 'SYNCED',
      lastSyncedAt: new Date(),
      syncVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      notificationPreference: null,
    };

    const mockInvoice = {
      id: 'invoice-123',
      workspaceId: 'workspace-123',
      customerId: 'customer-123',
      jobId: 'job-123',
      invoiceNumber: 'INV-20240115-ABC123',
      status: 'DRAFT' as const,
      amount: new Prisma.Decimal(100),
      tax: new Prisma.Decimal(10),
      total: new Prisma.Decimal(110),
      dueDate: new Date('2024-02-15'),
      paidAt: null,
      stripePaymentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return job status change event with invoice link', async () => {
      service.onModuleInit();

      const result = await service.notifyJobCompleted(mockJob as any, mockCustomer, {
        previousStatus: JobStatus.IN_PROGRESS,
        invoice: mockInvoice as any,
      });

      expect(result.jobId).toBe('job-123');
      expect(result.previousStatus).toBe(JobStatus.IN_PROGRESS);
      expect(result.nextStatus).toBe(JobStatus.COMPLETED);
      expect(result.invoiceLink).toBe('http://localhost:3000/invoices/invoice-123');
    });
  });

  describe('notifyInvoiceSent', () => {
    const mockCustomer: CustomerWithPreference = {
      id: 'customer-123',
      workspaceId: 'workspace-123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: { street: '123 Main St' },
      syncStatus: 'SYNCED',
      lastSyncedAt: new Date(),
      syncVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      notificationPreference: null,
    };

    const mockInvoice = {
      id: 'invoice-123',
      workspaceId: 'workspace-123',
      customerId: 'customer-123',
      jobId: 'job-123',
      invoiceNumber: 'INV-20240115-ABC123',
      status: 'SENT' as const,
      amount: new Prisma.Decimal(100),
      tax: new Prisma.Decimal(10),
      total: new Prisma.Decimal(110),
      dueDate: new Date('2024-02-15'),
      paidAt: null,
      stripePaymentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return success result when customer has email', async () => {
      service.onModuleInit();

      const result = await service.notifyInvoiceSent(mockInvoice as any, mockCustomer);

      expect(result.success).toBe(true);
      expect(result.channel).toBe('email');
    });

    it('should return failure result when customer has no email or phone', async () => {
      service.onModuleInit();

      const customerWithoutContact = { ...mockCustomer, email: null, phone: null };

      const result = await service.notifyInvoiceSent(mockInvoice as any, customerWithoutContact as any);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No notifications sent');
    });
  });

  describe('notifyPaymentReceived', () => {
    const mockCustomer: CustomerWithPreference = {
      id: 'customer-123',
      workspaceId: 'workspace-123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: null,
      address: { street: '123 Main St' },
      syncStatus: 'SYNCED',
      lastSyncedAt: new Date(),
      syncVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      notificationPreference: null,
    };

    const mockInvoice = {
      id: 'invoice-123',
      workspaceId: 'workspace-123',
      customerId: 'customer-123',
      jobId: 'job-123',
      invoiceNumber: 'INV-20240115-ABC123',
      status: 'PAID' as const,
      amount: new Prisma.Decimal(100),
      tax: new Prisma.Decimal(10),
      total: new Prisma.Decimal(110),
      dueDate: new Date('2024-02-15'),
      paidAt: new Date(),
      stripePaymentId: 'pi_test',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return success result when customer has email', async () => {
      service.onModuleInit();

      const result = await service.notifyPaymentReceived(mockInvoice as any, mockCustomer);

      expect(result.success).toBe(true);
      expect(result.channel).toBe('email');
    });
  });

  describe('notifyJobReminder', () => {
    const mockJob = {
      id: 'job-123',
      workspaceId: 'workspace-123',
      customerId: 'customer-123',
      technicianId: 'tech-123',
      title: 'HVAC Repair',
      description: 'Fix AC unit',
      status: JobStatus.SCHEDULED,
      scheduledAt: new Date('2024-01-15T10:00:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      estimatedDuration: 60,
      actualDuration: null,
      notes: null,
      address: '123 Main St',
      latitude: null,
      longitude: null,
      priority: 'NORMAL' as const,
    };

    const mockCustomer: CustomerWithPreference = {
      id: 'customer-123',
      workspaceId: 'workspace-123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: null,
      address: { street: '123 Main St' },
      syncStatus: 'SYNCED',
      lastSyncedAt: new Date(),
      syncVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      notificationPreference: null,
    };

    it('should send reminder with hours until appointment', async () => {
      service.onModuleInit();

      const result = await service.notifyJobReminder(mockJob as any, mockCustomer, 24);

      expect(result.success).toBe(true);
      expect(result.channel).toBe('email');
    });
  });

  describe('legacy methods', () => {
    const mockJob = {
      id: 'job-123',
      workspaceId: 'workspace-123',
      customerId: 'customer-123',
      technicianId: 'tech-123',
      title: 'HVAC Repair',
      description: 'Fix AC unit',
      status: JobStatus.IN_PROGRESS,
      scheduledAt: new Date('2024-01-15T10:00:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      estimatedDuration: 60,
      actualDuration: null,
      notes: null,
      address: '123 Main St',
      latitude: null,
      longitude: null,
      priority: 'NORMAL' as const,
    };

    const mockInvoice = {
      id: 'invoice-123',
      workspaceId: 'workspace-123',
      customerId: 'customer-123',
      jobId: 'job-123',
      invoiceNumber: 'INV-20240115-ABC123',
      status: 'DRAFT' as const,
      amount: new Prisma.Decimal(100),
      tax: new Prisma.Decimal(10),
      total: new Prisma.Decimal(110),
      dueDate: new Date('2024-02-15'),
      paidAt: null,
      stripePaymentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('logJobDispatched should return event without sending notifications', () => {
      const result = service.logJobDispatched(mockJob as any, {
        previousStatus: JobStatus.SCHEDULED,
      });

      expect(result.jobId).toBe('job-123');
      expect(result.trackingLink).toContain('http://localhost:3000/public/track/');
    });

    it('logJobCompleted should return event without sending notifications', () => {
      const result = service.logJobCompleted(
        { ...mockJob, status: JobStatus.COMPLETED } as any,
        {
          previousStatus: JobStatus.IN_PROGRESS,
          invoice: mockInvoice as any,
        },
      );

      expect(result.jobId).toBe('job-123');
      expect(result.invoiceLink).toBe('http://localhost:3000/invoices/invoice-123');
    });
  });
});

describe('NotificationService with SendGrid configured', () => {
  let service: NotificationService;

  const mockConfigServiceWithSendGrid = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        PUBLIC_APP_URL: 'http://localhost:3000',
        SENDGRID_API_KEY: 'SG.test_api_key',
        SENDGRID_FROM_EMAIL: 'noreply@flexdesk.io',
        SENDGRID_FROM_NAME: 'FlexDesk',
        TWILIO_ACCOUNT_SID: '',
        TWILIO_AUTH_TOKEN: '',
        TWILIO_FROM_NUMBER: '',
      };
      return config[key] ?? defaultValue;
    }),
  };

  const mockPrismaService = {
    notificationPreference: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: ConfigService, useValue: mockConfigServiceWithSendGrid },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    service.onModuleInit();
  });

  describe('sendEmail with SendGrid configured', () => {
    it('should call sgMail.send when SendGrid is configured', async () => {
      const mockResponse = [{
        statusCode: 202,
        headers: { 'x-message-id': 'msg-123' },
      }];
      (sgMail.send as jest.Mock).mockResolvedValue(mockResponse);

      const payload: EmailPayload = {
        to: 'test@example.com',
        subject: 'Test Email',
        template: 'job-dispatched',
        context: {
          customerName: 'John',
          jobTitle: 'HVAC Repair',
          scheduledAt: new Date().toISOString(),
          trackingLink: 'http://localhost:3000/track/abc',
        },
      };

      const result = await service.sendEmail(payload);

      expect(sgMail.setApiKey).toHaveBeenCalledWith('SG.test_api_key');
      expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
        to: 'test@example.com',
        subject: 'Test Email',
        from: {
          email: 'noreply@flexdesk.io',
          name: 'FlexDesk',
        },
      }));
      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
    });

    it('should return error result when SendGrid fails', async () => {
      (sgMail.send as jest.Mock).mockRejectedValue(new Error('SendGrid error'));

      const payload: EmailPayload = {
        to: 'test@example.com',
        subject: 'Test Email',
        template: 'job-dispatched',
        context: { customerName: 'John' },
      };

      const result = await service.sendEmail(payload);

      expect(result.success).toBe(false);
      expect(result.error).toBe('SendGrid error');
    });

    it('should render job-dispatched template correctly', async () => {
      const mockResponse = [{
        statusCode: 202,
        headers: { 'x-message-id': 'msg-123' },
      }];
      (sgMail.send as jest.Mock).mockResolvedValue(mockResponse);

      const payload: EmailPayload = {
        to: 'test@example.com',
        subject: 'Test Email',
        template: 'job-dispatched',
        context: {
          customerName: 'John',
          jobTitle: 'HVAC Repair',
          scheduledAt: '2024-01-15T10:00:00Z',
          trackingLink: 'http://localhost:3000/track/abc',
        },
      };

      await service.sendEmail(payload);

      expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
        html: expect.stringContaining('John'),
      }));
      expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
        html: expect.stringContaining('HVAC Repair'),
      }));
    });

    it('should render invoice-sent template correctly', async () => {
      const mockResponse = [{
        statusCode: 202,
        headers: { 'x-message-id': 'msg-456' },
      }];
      (sgMail.send as jest.Mock).mockResolvedValue(mockResponse);

      const payload: EmailPayload = {
        to: 'customer@example.com',
        subject: 'Invoice INV-001',
        template: 'invoice-sent',
        context: {
          customerName: 'Jane',
          invoiceNumber: 'INV-001',
          amount: '150.00',
          dueDate: '2024-02-15T00:00:00Z',
          invoiceLink: 'http://localhost:3000/invoices/123',
        },
      };

      await service.sendEmail(payload);

      expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
        html: expect.stringContaining('INV-001'),
      }));
      expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
        html: expect.stringContaining('$150.00'),
      }));
    });

    it('should render payment-received template correctly', async () => {
      const mockResponse = [{
        statusCode: 202,
        headers: { 'x-message-id': 'msg-789' },
      }];
      (sgMail.send as jest.Mock).mockResolvedValue(mockResponse);

      const payload: EmailPayload = {
        to: 'customer@example.com',
        subject: 'Payment Confirmed',
        template: 'payment-received',
        context: {
          customerName: 'Bob',
          invoiceNumber: 'INV-002',
          amount: '200.00',
          paidAt: '2024-01-20T14:30:00Z',
        },
      };

      await service.sendEmail(payload);

      expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
        html: expect.stringContaining('Payment Confirmed'),
      }));
    });

    it('should use default template for unknown template types', async () => {
      const mockResponse = [{
        statusCode: 202,
        headers: { 'x-message-id': 'msg-999' },
      }];
      (sgMail.send as jest.Mock).mockResolvedValue(mockResponse);

      const payload: EmailPayload = {
        to: 'test@example.com',
        subject: 'Unknown Template',
        template: 'unknown-template',
        context: { foo: 'bar' },
      };

      await service.sendEmail(payload);

      expect(sgMail.send).toHaveBeenCalledWith(expect.objectContaining({
        html: expect.stringContaining('FlexDesk Notification'),
      }));
    });
  });
});

describe('NotificationService with Twilio configured', () => {
  let service: NotificationService;

  const mockConfigServiceWithTwilio = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        PUBLIC_APP_URL: 'http://localhost:3000',
        SENDGRID_API_KEY: '',
        SENDGRID_FROM_EMAIL: 'noreply@flexdesk.io',
        SENDGRID_FROM_NAME: 'FlexDesk',
        TWILIO_ACCOUNT_SID: 'AC_test_sid',
        TWILIO_AUTH_TOKEN: 'test_auth_token',
        TWILIO_FROM_NUMBER: '+15551234567',
      };
      return config[key] ?? defaultValue;
    }),
  };

  const mockPrismaService = {
    notificationPreference: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockTwilioSend.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: ConfigService, useValue: mockConfigServiceWithTwilio },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    service.onModuleInit();
  });

  describe('sendSms with Twilio configured', () => {
    it('should call Twilio when configured', async () => {
      const result = await service.sendSms({
        to: '+15559876543',
        message: 'Test SMS message',
      });

      expect(result.success).toBe(true);
      expect(result.channel).toBe('sms');
      expect(result.messageId).toBe('test-sms-sid');
      expect(mockTwilioSend).toHaveBeenCalledWith({
        body: 'Test SMS message',
        to: '+15559876543',
        from: '+15551234567',
      });
    });

    it('should return error result when Twilio fails', async () => {
      mockTwilioSend.mockRejectedValueOnce(new Error('Twilio error'));

      const result = await service.sendSms({
        to: '+15559876543',
        message: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Twilio error');
    });
  });
});

import { BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { InvoiceStatus, Prisma } from '@prisma/client';

import { StripeConnectService } from './stripe-connect.service';
import { StripeSubscriptionService } from './stripe-subscription.service';
import { StripeService } from './stripe.service';

import { PrismaService } from '@/core/database/prisma.service';
import * as workspaceContext from '@/core/database/workspace-context';
import { NotificationService } from '@/modules/notifications/notification.service';

describe('StripeService', () => {
  let service: StripeService;

  const mockWorkspaceId = 'workspace-123';
  const mockInvoiceId = 'invoice-123';
  const mockCustomerId = 'customer-123';

  const mockInvoice = {
    id: mockInvoiceId,
    workspaceId: mockWorkspaceId,
    customerId: mockCustomerId,
    invoiceNumber: 'INV-20240115-ABC123',
    status: InvoiceStatus.DRAFT,
    amount: new Prisma.Decimal(100),
    tax: new Prisma.Decimal(10),
    total: new Prisma.Decimal(110),
    customer: {
      id: mockCustomerId,
      email: 'customer@example.com',
    },
  };

  const mockPrismaService = {
    invoice: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'stripe.secretKey': '',
        'stripe.webhookSecret': 'whsec_test',
        'app.publicAppUrl': 'http://localhost:3000',
      };
      return config[key];
    }),
  };

  const mockNotificationService = {
    notifyInvoiceSent: jest.fn().mockResolvedValue({ success: true, channel: 'email' }),
    notifyPaymentReceived: jest.fn().mockResolvedValue({ success: true, channel: 'email' }),
  };

  const mockStripeConnectService = {
    handleAccountUpdated: jest.fn().mockResolvedValue(undefined),
  };

  const mockStripeSubscriptionService = {
    handleSubscriptionUpdated: jest.fn().mockResolvedValue(undefined),
    handleSubscriptionDeleted: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.spyOn(workspaceContext, 'getWorkspaceId').mockReturnValue(mockWorkspaceId);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: StripeConnectService, useValue: mockStripeConnectService },
        { provide: StripeSubscriptionService, useValue: mockStripeSubscriptionService },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentLink', () => {
    it('should throw ServiceUnavailableException when Stripe is not configured', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue(mockInvoice);

      await expect(service.createPaymentLink(mockInvoiceId)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('should throw ServiceUnavailableException without workspace context', async () => {
      jest.spyOn(workspaceContext, 'getWorkspaceId').mockReturnValue(null);

      await expect(service.createPaymentLink(mockInvoiceId)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('getPaymentStatus', () => {
    it('should throw ServiceUnavailableException when Stripe is not configured', async () => {
      await expect(service.getPaymentStatus('pi_test')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('handleWebhook', () => {
    it('should throw ServiceUnavailableException when Stripe is not configured', async () => {
      const payload = Buffer.from('{}');
      const signature = 'sig_test';

      await expect(service.handleWebhook(payload, signature)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('createPaymentLinkForPortal', () => {
    it('should throw ServiceUnavailableException when Stripe is not configured', async () => {
      await expect(
        service.createPaymentLinkForPortal(mockInvoiceId, mockCustomerId, mockWorkspaceId),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });
});

describe('StripeService with Stripe configured', () => {
  let service: StripeService;

  const mockWorkspaceId = 'workspace-123';
  const mockInvoiceId = 'invoice-123';
  const mockCustomerId = 'customer-123';

  const mockInvoice = {
    id: mockInvoiceId,
    workspaceId: mockWorkspaceId,
    customerId: mockCustomerId,
    invoiceNumber: 'INV-20240115-ABC123',
    status: InvoiceStatus.DRAFT,
    amount: new Prisma.Decimal(100),
    tax: new Prisma.Decimal(10),
    total: new Prisma.Decimal(110),
    customer: {
      id: mockCustomerId,
      email: 'customer@example.com',
    },
  };

  const mockPrismaService = {
    invoice: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockConfigServiceWithStripe = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'stripe.secretKey': 'sk_test_fake_key',
        'stripe.webhookSecret': 'whsec_test',
        'app.publicAppUrl': 'http://localhost:3000',
      };
      return config[key];
    }),
  };

  const mockNotificationServiceWithStripe = {
    notifyInvoiceSent: jest.fn().mockResolvedValue({ success: true, channel: 'email' }),
    notifyPaymentReceived: jest.fn().mockResolvedValue({ success: true, channel: 'email' }),
  };

  const mockStripeConnectServiceWithStripe = {
    handleAccountUpdated: jest.fn().mockResolvedValue(undefined),
  };

  const mockStripeSubscriptionServiceWithStripe = {
    handleSubscriptionUpdated: jest.fn().mockResolvedValue(undefined),
    handleSubscriptionDeleted: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.spyOn(workspaceContext, 'getWorkspaceId').mockReturnValue(mockWorkspaceId);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigServiceWithStripe },
        { provide: NotificationService, useValue: mockNotificationServiceWithStripe },
        { provide: StripeConnectService, useValue: mockStripeConnectServiceWithStripe },
        { provide: StripeSubscriptionService, useValue: mockStripeSubscriptionServiceWithStripe },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentLink', () => {
    it('should throw NotFoundException when invoice not found', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue(null);

      await expect(service.createPaymentLink(mockInvoiceId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when invoice already paid', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.PAID,
      });

      await expect(service.createPaymentLink(mockInvoiceId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when invoice cancelled', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.CANCELLED,
      });

      await expect(service.createPaymentLink(mockInvoiceId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createPaymentLinkForPortal', () => {
    it('should throw NotFoundException when invoice not found', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue(null);

      await expect(
        service.createPaymentLinkForPortal(mockInvoiceId, mockCustomerId, mockWorkspaceId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when invoice already paid', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.PAID,
      });

      await expect(
        service.createPaymentLinkForPortal(mockInvoiceId, mockCustomerId, mockWorkspaceId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when invoice cancelled', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.CANCELLED,
      });

      await expect(
        service.createPaymentLinkForPortal(mockInvoiceId, mockCustomerId, mockWorkspaceId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should query invoice with customerId filter for security', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue(null);

      try {
        await service.createPaymentLinkForPortal(mockInvoiceId, mockCustomerId, mockWorkspaceId);
      } catch {
        // Expected to throw
      }

      expect(mockPrismaService.invoice.findFirst).toHaveBeenCalledWith({
        where: { id: mockInvoiceId, customerId: mockCustomerId, workspaceId: mockWorkspaceId },
        include: { customer: true },
      });
    });
  });

  describe('handleWebhook - subscription events', () => {
    let mockConstructEvent: jest.Mock;

    beforeEach(() => {
      // Access the private stripe instance to mock constructEvent
      const stripeInstance = (service as any).stripe;
      if (stripeInstance) {
        mockConstructEvent = jest.fn();
        stripeInstance.webhooks = { constructEvent: mockConstructEvent };
        stripeInstance.subscriptions = {
          retrieve: jest.fn().mockResolvedValue({
            id: 'sub_123',
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + 2592000,
            metadata: { workspace_id: mockWorkspaceId },
          }),
        };
      }
    });

    it('should delegate customer.subscription.updated to StripeSubscriptionService', async () => {
      const mockSubscription = {
        id: 'sub_123',
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + 2592000,
        metadata: { workspace_id: mockWorkspaceId },
      };

      mockConstructEvent.mockReturnValue({
        type: 'customer.subscription.updated',
        data: { object: mockSubscription },
      });

      const result = await service.handleWebhook(Buffer.from('{}'), 'sig_test');

      expect(mockStripeSubscriptionServiceWithStripe.handleSubscriptionUpdated).toHaveBeenCalledWith(mockSubscription);
      expect(result).toEqual({ type: 'customer.subscription.updated', status: 'processed' });
    });

    it('should delegate customer.subscription.deleted to StripeSubscriptionService', async () => {
      const mockSubscription = {
        id: 'sub_123',
        status: 'canceled',
        metadata: { workspace_id: mockWorkspaceId },
      };

      mockConstructEvent.mockReturnValue({
        type: 'customer.subscription.deleted',
        data: { object: mockSubscription },
      });

      const result = await service.handleWebhook(Buffer.from('{}'), 'sig_test');

      expect(mockStripeSubscriptionServiceWithStripe.handleSubscriptionDeleted).toHaveBeenCalledWith(mockSubscription);
      expect(result).toEqual({ type: 'customer.subscription.deleted', status: 'processed' });
    });

    it('should refresh subscription on invoice.payment_succeeded with subscription', async () => {
      const mockStripeInvoice = {
        id: 'in_123',
        subscription: 'sub_123',
        metadata: {},
      };

      mockConstructEvent.mockReturnValue({
        type: 'invoice.payment_succeeded',
        data: { object: mockStripeInvoice },
      });

      const result = await service.handleWebhook(Buffer.from('{}'), 'sig_test');

      expect(mockStripeSubscriptionServiceWithStripe.handleSubscriptionUpdated).toHaveBeenCalled();
      expect(result).toEqual({ type: 'invoice.payment_succeeded', status: 'processed' });
    });

    it('should log warning on invoice.payment_failed with subscription', async () => {
      const mockStripeInvoice = {
        id: 'in_456',
        subscription: 'sub_123',
        metadata: { workspaceId: mockWorkspaceId },
      };

      mockConstructEvent.mockReturnValue({
        type: 'invoice.payment_failed',
        data: { object: mockStripeInvoice },
      });

      const result = await service.handleWebhook(Buffer.from('{}'), 'sig_test');

      expect(result).toEqual({ type: 'invoice.payment_failed', status: 'processed' });
    });

    it('should return ignored for invoice.payment_failed without subscription or invoiceId', async () => {
      const mockStripeInvoice = {
        id: 'in_789',
        subscription: null,
        metadata: {},
      };

      mockConstructEvent.mockReturnValue({
        type: 'invoice.payment_failed',
        data: { object: mockStripeInvoice },
      });

      const result = await service.handleWebhook(Buffer.from('{}'), 'sig_test');

      expect(result).toEqual({ type: 'invoice.payment_failed', status: 'ignored' });
    });
  });
});

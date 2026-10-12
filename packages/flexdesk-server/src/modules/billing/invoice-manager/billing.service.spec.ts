import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { JobStatus, InvoiceStatus, SyncStatus, Prisma } from '@prisma/client';

import { BillingService } from './billing.service';

import { PrismaService } from '@/core/database/prisma.service';
import * as workspaceContext from '@/core/database/workspace-context';
import { NotificationService } from '@/modules/notifications/notification.service';

describe('BillingService', () => {
  let service: BillingService;

  const mockWorkspaceId = 'workspace-123';
  const mockJobId = 'job-123';
  const mockInvoiceId = 'invoice-123';
  const mockCustomerId = 'customer-123';

  const mockJob = {
    id: mockJobId,
    workspaceId: mockWorkspaceId,
    customerId: mockCustomerId,
    title: 'Test Job',
    status: JobStatus.COMPLETED,
    estimatedDuration: 60,
    customer: { id: mockCustomerId, name: 'John Doe' },
  };

  const mockInvoice = {
    id: mockInvoiceId,
    workspaceId: mockWorkspaceId,
    jobId: mockJobId,
    customerId: mockCustomerId,
    invoiceNumber: 'INV-20240115-ABC123',
    status: InvoiceStatus.DRAFT,
    amount: new Prisma.Decimal(100),
    tax: new Prisma.Decimal(10),
    total: new Prisma.Decimal(110),
    dueDate: new Date(),
    paidAt: null,
    syncStatus: SyncStatus.PENDING,
    syncVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    lineItems: [],
  };

  const mockPrismaService = {
    job: {
      findFirst: jest.fn(),
    },
    invoice: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockNotificationService = {
    notifyInvoiceSent: jest.fn().mockResolvedValue({ success: true, channel: 'email' }),
    notifyPaymentReceived: jest.fn().mockResolvedValue({ success: true, channel: 'email' }),
  };

  beforeEach(async () => {
    jest.spyOn(workspaceContext, 'getWorkspaceId').mockReturnValue(mockWorkspaceId);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createInvoiceFromJob', () => {
    it('should create an invoice from a completed job', async () => {
      mockPrismaService.job.findFirst.mockResolvedValue(mockJob);
      mockPrismaService.invoice.create.mockResolvedValue(mockInvoice);

      const result = await service.createInvoiceFromJob(mockJobId);

      expect(result).toEqual(mockInvoice);
      expect(mockPrismaService.invoice.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when job not found', async () => {
      mockPrismaService.job.findFirst.mockResolvedValue(null);

      await expect(service.createInvoiceFromJob('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when job not completed', async () => {
      mockPrismaService.job.findFirst.mockResolvedValue({
        ...mockJob,
        status: JobStatus.SCHEDULED,
      });

      await expect(service.createInvoiceFromJob(mockJobId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAllInvoices', () => {
    it('should return all invoices', async () => {
      mockPrismaService.invoice.findMany.mockResolvedValue([mockInvoice]);

      const result = await service.findAllInvoices();

      expect(result).toEqual([mockInvoice]);
    });

    it('should filter by status when provided', async () => {
      mockPrismaService.invoice.findMany.mockResolvedValue([mockInvoice]);

      await service.findAllInvoices(InvoiceStatus.DRAFT);

      expect(mockPrismaService.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: InvoiceStatus.DRAFT,
          }),
        }),
      );
    });
  });

  describe('updateInvoiceStatus', () => {
    it('should update invoice status', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue(mockInvoice);
      mockPrismaService.invoice.update.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.SENT,
      });

      const result = await service.updateInvoiceStatus(mockInvoiceId, InvoiceStatus.SENT);

      expect(result.status).toBe(InvoiceStatus.SENT);
    });
  });

  describe('markInvoicePaid', () => {
    it('should mark invoice as paid', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue(mockInvoice);
      mockPrismaService.invoice.update.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
      });

      const result = await service.markInvoicePaid(mockInvoiceId, 'stripe-payment-123');

      expect(result.status).toBe(InvoiceStatus.PAID);
      expect(result.paidAt).toBeDefined();
    });
  });

  describe('sendInvoice', () => {
    it('should send a draft invoice and notify customer', async () => {
      const mockCustomer = {
        id: mockCustomerId,
        name: 'John Doe',
        email: 'john@example.com',
        notificationPreference: null,
      };
      mockPrismaService.invoice.findFirst.mockResolvedValue(mockInvoice);
      mockPrismaService.invoice.update.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.SENT,
        customer: mockCustomer,
      });

      const result = await service.sendInvoice(mockInvoiceId);

      expect(result.status).toBe(InvoiceStatus.SENT);
      expect(mockNotificationService.notifyInvoiceSent).toHaveBeenCalledWith(
        expect.objectContaining({ status: InvoiceStatus.SENT }),
        mockCustomer,
      );
    });

    it('should throw BadRequestException when invoice not draft', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.SENT,
      });

      await expect(service.sendInvoice(mockInvoiceId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

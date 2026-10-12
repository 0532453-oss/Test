import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  type Invoice,
  InvoiceStatus,
  JobStatus,
  Prisma,
  SyncStatus,
} from '@prisma/client';

import { PrismaService } from '@/core/database/prisma.service';
import { getWorkspaceId } from '@/core/database/workspace-context';
import { NotificationService } from '@/modules/notifications/notification.service';

const DEFAULT_HOURLY_RATE = parseFloat(
  process.env.DEFAULT_JOB_HOURLY_RATE ?? '100',
);
const DEFAULT_TAX_RATE = parseFloat(process.env.DEFAULT_TAX_RATE ?? '0.1');
const DEFAULT_DUE_DATE_DAYS = parseInt(
  process.env.DEFAULT_INVOICE_DUE_DATE_DAYS ?? '30',
  10,
);

export interface CreateInvoiceFromJobOptions {
  dueDate?: Date;
  autoSend?: boolean;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  private getWorkspaceIdOrThrow(): string {
    const workspaceId = getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Workspace context is required');
    }
    return workspaceId;
  }

  async findAllInvoices(status?: InvoiceStatus): Promise<Invoice[]> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const where: Prisma.InvoiceWhereInput = { workspaceId };
    if (status) {
      where.status = status;
    }

    return this.prisma.invoice.findMany({
      where,
      include: {
        customer: true,
        job: true,
        lineItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findInvoiceById(id: string): Promise<Invoice> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const invoice = await this.prisma.invoice.findFirst({
      where: { id, workspaceId },
      include: {
        customer: true,
        job: true,
        lineItems: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async findInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    return this.prisma.invoice.findMany({
      where: { workspaceId, customerId },
      include: {
        job: true,
        lineItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    const invoice = await this.findInvoiceById(id);

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status,
        syncStatus: SyncStatus.PENDING,
        syncVersion: invoice.syncVersion + 1,
        ...(status === InvoiceStatus.PAID && { paidAt: new Date() }),
      },
      include: {
        customer: true,
        lineItems: true,
      },
    });
  }

  async sendInvoice(id: string): Promise<Invoice> {
    const invoice = await this.findInvoiceById(id);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only draft invoices can be sent');
    }

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.SENT,
        syncStatus: SyncStatus.PENDING,
        syncVersion: invoice.syncVersion + 1,
      },
      include: {
        customer: {
          include: {
            notificationPreference: true,
          },
        },
        lineItems: true,
      },
    });

    // Send email notification to customer
    if (updatedInvoice.customer) {
      try {
        await this.notificationService.notifyInvoiceSent(
          updatedInvoice,
          updatedInvoice.customer,
        );
        this.logger.log(`Invoice sent notification delivered for invoice ${updatedInvoice.invoiceNumber}`);
      } catch (error) {
        this.logger.error(`Failed to send invoice notification: ${error}`);
        // Don't fail the invoice send operation if notification fails
      }
    }

    return updatedInvoice;
  }

  async markInvoicePaid(id: string, stripePaymentId?: string): Promise<Invoice> {
    const invoice = await this.findInvoiceById(id);

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
        stripePaymentId,
        syncStatus: SyncStatus.PENDING,
        syncVersion: invoice.syncVersion + 1,
      },
      include: {
        customer: true,
        lineItems: true,
      },
    });
  }

  async createInvoiceFromJob(
    jobId: string,
    options: CreateInvoiceFromJobOptions = {},
  ): Promise<Invoice> {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId },
      include: {
        customer: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== JobStatus.COMPLETED) {
      throw new BadRequestException(
        'Invoice can only be created for completed jobs',
      );
    }

    const estimatedDurationMinutes =
      typeof job.estimatedDuration === 'number' && job.estimatedDuration > 0
        ? job.estimatedDuration
        : 60;

    const baseAmountNumber =
      (estimatedDurationMinutes / 60) * DEFAULT_HOURLY_RATE;
    const taxNumber = baseAmountNumber * DEFAULT_TAX_RATE;
    const totalNumber = baseAmountNumber + taxNumber;

    const amount = new Prisma.Decimal(baseAmountNumber.toFixed(2));
    const tax = new Prisma.Decimal(taxNumber.toFixed(2));
    const total = new Prisma.Decimal(totalNumber.toFixed(2));

    const now = new Date();
    const dueDate =
      options.dueDate ??
      new Date(
        now.getTime() + DEFAULT_DUE_DATE_DAYS * 24 * 60 * 60 * 1000,
      );

    const invoiceNumber = this.generateInvoiceNumber();

    // If autoSend is true, create as SENT instead of DRAFT
    const initialStatus = options.autoSend ? InvoiceStatus.SENT : InvoiceStatus.DRAFT;

    const invoice = await this.prisma.invoice.create({
      data: {
        workspaceId: job.workspaceId,
        jobId: job.id,
        customerId: job.customerId,
        invoiceNumber,
        status: initialStatus,
        amount,
        tax,
        total,
        dueDate,
        lineItems: {
          create: {
            description: `Service for job: ${job.title}`,
            quantity: new Prisma.Decimal(1),
            unitPrice: amount,
            total: amount,
          },
        },
      },
      include: {
        lineItems: true,
        customer: {
          include: {
            notificationPreference: true,
          },
        },
      },
    });

    // Send email notification when autoSend is true
    if (options.autoSend && invoice.customer) {
      try {
        await this.notificationService.notifyInvoiceSent(
          invoice,
          invoice.customer,
        );
        this.logger.log(`Invoice created and sent notification delivered for invoice ${invoice.invoiceNumber}`);
      } catch (error) {
        this.logger.error(`Failed to send invoice creation notification: ${error}`);
        // Don't fail the invoice creation if notification fails
      }
    }

    return invoice;
  }

  private generateInvoiceNumber(): string {
    const now = new Date();
    const datePart = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('');

    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();

    return `INV-${datePart}-${randomPart}`;
  }
}


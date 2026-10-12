import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InvoiceStatus, JobStatus, Prisma, SyncStatus } from '@prisma/client';

import { PrismaService } from '@/core/database';
import { runWithWorkspace } from '@/core/database/workspace-context';
import { NotificationService } from '@/modules/notifications/notification.service';

const DEFAULT_HOURLY_RATE = parseFloat(process.env.DEFAULT_JOB_HOURLY_RATE ?? '100');
const DEFAULT_TAX_RATE = parseFloat(process.env.DEFAULT_TAX_RATE ?? '0.1');
const DEFAULT_DUE_DATE_DAYS = parseInt(process.env.DEFAULT_INVOICE_DUE_DATE_DAYS ?? '30', 10);

/**
 * Invoice Generation Processor
 *
 * Handles automatic invoice operations:
 * - Generate invoices for completed jobs without invoices
 * - Send payment reminders for overdue invoices
 * - Process recurring invoices
 */
@Injectable()
export class InvoiceGenerationProcessor {
  private readonly logger = new Logger(InvoiceGenerationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Generate invoices for completed jobs that don't have invoices
   * Runs every 10 minutes
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async generateInvoicesForCompletedJobs() {
    this.logger.debug('Checking for completed jobs without invoices...');

    try {
      const completedJobsWithoutInvoice = await this.prisma.job.findMany({
        where: {
          status: JobStatus.COMPLETED,
          invoice: null,
          completedAt: { not: null },
        },
        include: {
          customer: {
            include: {
              notificationPreference: true,
            },
          },
        },
        take: 50, // Process in batches to avoid overwhelming the system
      });

      if (completedJobsWithoutInvoice.length === 0) {
        return;
      }

      this.logger.log(`Found ${completedJobsWithoutInvoice.length} jobs needing invoices`);

      let successCount = 0;
      for (const job of completedJobsWithoutInvoice) {
        try {
          // Set workspace context so the RLS extension scopes
          // the invoice creation to the correct workspace.
          const invoice = await runWithWorkspace(job.workspaceId, () =>
            this.createInvoiceForJob(job),
          );

          // Send notification to customer
          if (invoice && job.customer) {
            try {
              await this.notificationService.notifyInvoiceSent(invoice, job.customer);
            } catch (notifyError) {
              this.logger.error(`Failed to send invoice notification for job ${job.id}`, notifyError);
            }
          }

          successCount++;
          this.logger.log(`Generated invoice ${invoice.invoiceNumber} for job ${job.id}`);
        } catch (error) {
          this.logger.error(`Failed to generate invoice for job ${job.id}`, error);
        }
      }

      this.logger.log(`Generated ${successCount}/${completedJobsWithoutInvoice.length} invoices`);
    } catch (error) {
      this.logger.error('Failed to generate invoices', error);
    }
  }

  /**
   * Send payment reminders for overdue invoices
   * Runs daily at 9 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendPaymentReminders() {
    this.logger.log('Sending payment reminders for overdue invoices...');

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    try {
      const overdueInvoices = await this.prisma.invoice.findMany({
        where: {
          status: InvoiceStatus.SENT,
          dueDate: { lt: now },
          createdAt: { gt: thirtyDaysAgo }, // Don't spam very old invoices
        },
        include: {
          customer: {
            include: {
              notificationPreference: true,
            },
          },
        },
      });

      if (overdueInvoices.length === 0) {
        this.logger.debug('No overdue invoices found');
        return;
      }

      this.logger.log(`Found ${overdueInvoices.length} overdue invoices`);

      let sentCount = 0;
      for (const invoice of overdueInvoices) {
        if (!invoice.customer) continue;

        try {
          await this.notificationService.notifyInvoiceSent(invoice, invoice.customer);
          sentCount++;
        } catch (error) {
          this.logger.error(`Failed to send reminder for invoice ${invoice.id}`, error);
        }
      }

      this.logger.log(`Sent ${sentCount} payment reminders`);
    } catch (error) {
      this.logger.error('Failed to send payment reminders', error);
    }
  }

  /**
   * Check for invoices about to be overdue (3 days before due date)
   * Runs daily at 10 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async sendUpcomingDueReminders() {
    this.logger.debug('Checking for invoices due soon...');

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const fourDaysFromNow = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

    try {
      const soonDueInvoices = await this.prisma.invoice.findMany({
        where: {
          status: InvoiceStatus.SENT,
          dueDate: {
            gte: threeDaysFromNow,
            lt: fourDaysFromNow,
          },
        },
        include: {
          customer: {
            include: {
              notificationPreference: true,
            },
          },
        },
      });

      if (soonDueInvoices.length === 0) {
        return;
      }

      this.logger.log(`Found ${soonDueInvoices.length} invoices due in 3 days`);

      for (const invoice of soonDueInvoices) {
        if (!invoice.customer || !invoice.customer.email) continue;

        try {
          // Send a friendly reminder
          await this.notificationService.sendEmail({
            to: invoice.customer.email,
            subject: `Friendly reminder: Invoice ${invoice.invoiceNumber} due in 3 days`,
            template: 'invoice-sent',
            context: {
              customerName: invoice.customer.name,
              invoiceNumber: invoice.invoiceNumber,
              amount: invoice.total.toString(),
              dueDate: invoice.dueDate,
              invoiceLink: `${process.env.PUBLIC_APP_URL || ''}/invoices/${invoice.id}`,
            },
          });
        } catch (error) {
          this.logger.error(`Failed to send due reminder for invoice ${invoice.id}`, error);
        }
      }
    } catch (error) {
      this.logger.error('Failed to send upcoming due reminders', error);
    }
  }

  /**
   * Create an invoice for a completed job.
   * Called within a runWithWorkspace() context from the processor.
   */
  private async createInvoiceForJob(job: {
    id: string;
    workspaceId: string;
    customerId: string;
    title: string;
    estimatedDuration: number | null;
  }) {
    const estimatedDurationMinutes =
      typeof job.estimatedDuration === 'number' && job.estimatedDuration > 0
        ? job.estimatedDuration
        : 60;

    const baseAmountNumber = (estimatedDurationMinutes / 60) * DEFAULT_HOURLY_RATE;
    const taxNumber = baseAmountNumber * DEFAULT_TAX_RATE;
    const totalNumber = baseAmountNumber + taxNumber;

    const amount = new Prisma.Decimal(baseAmountNumber.toFixed(2));
    const tax = new Prisma.Decimal(taxNumber.toFixed(2));
    const total = new Prisma.Decimal(totalNumber.toFixed(2));

    const now = new Date();
    const dueDate = new Date(now.getTime() + DEFAULT_DUE_DATE_DAYS * 24 * 60 * 60 * 1000);

    const invoiceNumber = this.generateInvoiceNumber();

    return this.prisma.invoice.create({
      data: {
        workspaceId: job.workspaceId,
        jobId: job.id,
        customerId: job.customerId,
        invoiceNumber,
        status: InvoiceStatus.SENT, // Auto-send invoices
        amount,
        tax,
        total,
        dueDate,
        syncStatus: SyncStatus.PENDING,
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
        customer: true,
      },
    });
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

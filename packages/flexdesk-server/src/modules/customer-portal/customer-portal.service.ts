import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Customer, Invoice, Job, type InvoiceStatus, type JobStatus } from '@prisma/client';

import { PrismaService } from '@/core/database/prisma.service';
import { StripeService, type PaymentLinkResult } from '@/modules/billing/stripe-manager/stripe.service';
import {
  signCustomerPortalToken,
  verifyCustomerPortalToken,
  type CustomerPortalTokenPayload,
} from '@/utils/crypto';

export interface CustomerPortalData {
  customer: CustomerSummary;
  invoices: InvoiceSummary[];
  jobs: JobSummary[];
}

export interface CustomerSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  amount: string;
  tax: string;
  total: string;
  dueDate: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  job: {
    id: string;
    title: string;
  } | null;
  lineItems: {
    description: string;
    quantity: string;
    unitPrice: string;
    total: string;
  }[];
}

export interface JobSummary {
  id: string;
  title: string;
  description: string | null;
  status: JobStatus;
  scheduledAt: Date | null;
  completedAt: Date | null;
  technician: {
    id: string;
    name: string;
  } | null;
}

export interface PortalTokenResult {
  token: string;
  expiresAt: Date;
}

const DEFAULT_TOKEN_EXPIRY_DAYS = 30;

@Injectable()
export class CustomerPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  /**
   * Generate a portal access token for a customer.
   * Called by admin users to create a link they can send to customers.
   */
  async generatePortalToken(
    customerId: string,
    workspaceId: string,
    expiryDays: number = DEFAULT_TOKEN_EXPIRY_DAYS,
  ): Promise<PortalTokenResult> {
    // Verify customer exists and belongs to workspace
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, workspaceId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const payload: CustomerPortalTokenPayload = {
      customerId,
      workspaceId,
      exp: Math.floor(expiresAt.getTime() / 1000),
    };

    const token = signCustomerPortalToken(payload);

    return {
      token,
      expiresAt,
    };
  }

  /**
   * Verify a portal token and return the payload.
   * Used by public endpoints to authenticate customer requests.
   */
  verifyToken(token: string): CustomerPortalTokenPayload {
    const payload = verifyCustomerPortalToken(token);

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired portal token');
    }

    return payload;
  }

  /**
   * Get customer portal data including invoices and job history.
   * This is the main endpoint for the customer portal.
   */
  async getPortalData(
    customerId: string,
    workspaceId: string,
  ): Promise<CustomerPortalData> {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, workspaceId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const [invoices, jobs] = await Promise.all([
      this.getCustomerInvoices(customerId, workspaceId),
      this.getCustomerJobs(customerId, workspaceId),
    ]);

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      invoices,
      jobs,
    };
  }

  /**
   * Get a single invoice by ID for a customer.
   */
  async getInvoiceById(
    invoiceId: string,
    customerId: string,
    workspaceId: string,
  ): Promise<InvoiceSummary> {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        customerId,
        workspaceId,
      },
      include: {
        job: true,
        lineItems: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.mapInvoiceToSummary(invoice);
  }

  /**
   * Get a single job by ID for a customer.
   */
  async getJobById(
    jobId: string,
    customerId: string,
    workspaceId: string,
  ): Promise<JobSummary> {
    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        customerId,
        workspaceId,
      },
      include: {
        technician: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return this.mapJobToSummary(job);
  }

  private async getCustomerInvoices(
    customerId: string,
    workspaceId: string,
  ): Promise<InvoiceSummary[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: { customerId, workspaceId },
      include: {
        job: true,
        lineItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map((invoice) => this.mapInvoiceToSummary(invoice));
  }

  private async getCustomerJobs(
    customerId: string,
    workspaceId: string,
  ): Promise<JobSummary[]> {
    const jobs = await this.prisma.job.findMany({
      where: { customerId, workspaceId },
      include: {
        technician: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    return jobs.map((job) => this.mapJobToSummary(job));
  }

  private mapInvoiceToSummary(invoice: any): InvoiceSummary {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      amount: invoice.amount.toString(),
      tax: invoice.tax.toString(),
      total: invoice.total.toString(),
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt,
      createdAt: invoice.createdAt,
      job: invoice.job
        ? {
            id: invoice.job.id,
            title: invoice.job.title,
          }
        : null,
      lineItems: (invoice.lineItems ?? []).map((item: any) => ({
        description: item.description,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        total: item.total.toString(),
      })),
    };
  }

  private mapJobToSummary(job: any): JobSummary {
    const technician = job.technician;
    let technicianName = 'Unassigned';

    if (technician?.user) {
      const firstName = technician.user.firstName ?? '';
      const lastName = technician.user.lastName ?? '';
      technicianName = `${firstName} ${lastName}`.trim() || 'Technician';
    }

    return {
      id: job.id,
      title: job.title,
      description: job.description,
      status: job.status,
      scheduledAt: job.scheduledAt,
      completedAt: job.completedAt,
      technician: technician
        ? {
            id: technician.id,
            name: technicianName,
          }
        : null,
    };
  }

  /**
   * Generate a payment link for an invoice.
   * Allows customers to initiate payment from the portal.
   */
  async getInvoicePaymentLink(
    invoiceId: string,
    customerId: string,
    workspaceId: string,
  ): Promise<PaymentLinkResult> {
    return this.stripeService.createPaymentLinkForPortal(
      invoiceId,
      customerId,
      workspaceId,
    );
  }
}

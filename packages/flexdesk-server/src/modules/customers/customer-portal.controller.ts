import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { type Customer, Invoice, Job } from '@prisma/client';

import { PrismaService } from '@/core/database/prisma.service';
import { Public } from '@/modules/auth/decorators/public.decorator';
import {
  signCustomerPortalToken,
  verifyCustomerPortalToken,
} from '@/utils/crypto';

interface CustomerPortalData {
  customer: Pick<Customer, 'id' | 'name' | 'email' | 'phone'>;
}

interface CustomerInvoice {
  id: string;
  invoiceNumber: string;
  status: string;
  amount: number;
  tax: number;
  total: number;
  dueDate: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  job: {
    id: string;
    title: string;
    completedAt: Date | null;
  } | null;
}

interface CustomerJob {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduledAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

interface CustomerPortalInvoicesResponse extends CustomerPortalData {
  invoices: CustomerInvoice[];
}

interface CustomerPortalJobsResponse extends CustomerPortalData {
  jobs: CustomerJob[];
}

interface CustomerPortalInvoiceDetailResponse extends CustomerPortalData {
  invoice: CustomerInvoice & {
    lineItems: {
      id: string;
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }[];
  };
}

@ApiTags('customer-portal')
@Controller('portal')
export class CustomerPortalController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a customer portal access token (authenticated endpoint for admins)
   */
  @Post('generate-token/:customerId')
  @ApiOperation({ summary: 'Generate customer portal access token' })
  @ApiParam({ name: 'customerId', description: 'Customer UUID' })
  @ApiResponse({ status: 201, description: 'Token generated' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async generateToken(
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    // Token valid for 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const exp = Math.floor(expiresAt.getTime() / 1000);

    const token = signCustomerPortalToken({
      customerId: customer.id,
      workspaceId: customer.workspaceId,
      exp,
    });

    return { token, expiresAt };
  }

  /**
   * Get customer invoices (public endpoint with token)
   */
  @Public()
  @Get('invoices')
  @ApiOperation({ summary: 'Get customer invoices via portal token' })
  @ApiQuery({ name: 'token', required: true, description: 'Portal access token' })
  @ApiResponse({ status: 200, description: 'List of customer invoices' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async getInvoices(
    @Query('token') token: string,
  ): Promise<CustomerPortalInvoicesResponse> {
    const payload = this.verifyTokenOrThrow(token);

    const customer = await this.prisma.customer.findFirst({
      where: {
        id: payload.customerId,
        workspaceId: payload.workspaceId,
      },
    });

    if (!customer) {
      throw new UnauthorizedException('Customer not found');
    }

    const invoices = await this.prisma.invoice.findMany({
      where: {
        customerId: payload.customerId,
        workspaceId: payload.workspaceId,
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            completedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        status: inv.status,
        amount: Number(inv.amount),
        tax: Number(inv.tax),
        total: Number(inv.total),
        dueDate: inv.dueDate,
        paidAt: inv.paidAt,
        createdAt: inv.createdAt,
        job: inv.job,
      })),
    };
  }

  /**
   * Get single invoice detail (public endpoint with token)
   */
  @Public()
  @Get('invoices/:invoiceId')
  @ApiOperation({ summary: 'Get invoice detail via portal token' })
  @ApiParam({ name: 'invoiceId', description: 'Invoice UUID' })
  @ApiQuery({ name: 'token', required: true, description: 'Portal access token' })
  @ApiResponse({ status: 200, description: 'Invoice detail' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoiceDetail(
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
    @Query('token') token: string,
  ): Promise<CustomerPortalInvoiceDetailResponse> {
    const payload = this.verifyTokenOrThrow(token);

    const customer = await this.prisma.customer.findFirst({
      where: {
        id: payload.customerId,
        workspaceId: payload.workspaceId,
      },
    });

    if (!customer) {
      throw new UnauthorizedException('Customer not found');
    }

    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        customerId: payload.customerId,
        workspaceId: payload.workspaceId,
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            completedAt: true,
          },
        },
        lineItems: true,
      },
    });

    if (!invoice) {
      throw new BadRequestException('Invoice not found');
    }

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        amount: Number(invoice.amount),
        tax: Number(invoice.tax),
        total: Number(invoice.total),
        dueDate: invoice.dueDate,
        paidAt: invoice.paidAt,
        createdAt: invoice.createdAt,
        job: invoice.job,
        lineItems: invoice.lineItems.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
        })),
      },
    };
  }

  /**
   * Get customer job history (public endpoint with token)
   */
  @Public()
  @Get('jobs')
  @ApiOperation({ summary: 'Get customer job history via portal token' })
  @ApiQuery({ name: 'token', required: true, description: 'Portal access token' })
  @ApiResponse({ status: 200, description: 'List of customer jobs' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async getJobs(
    @Query('token') token: string,
  ): Promise<CustomerPortalJobsResponse> {
    const payload = this.verifyTokenOrThrow(token);

    const customer = await this.prisma.customer.findFirst({
      where: {
        id: payload.customerId,
        workspaceId: payload.workspaceId,
      },
    });

    if (!customer) {
      throw new UnauthorizedException('Customer not found');
    }

    const jobs = await this.prisma.job.findMany({
      where: {
        customerId: payload.customerId,
        workspaceId: payload.workspaceId,
      },
      orderBy: { scheduledAt: 'desc' },
    });

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      jobs: jobs.map((job) => ({
        id: job.id,
        title: job.title,
        description: job.description,
        status: job.status,
        scheduledAt: job.scheduledAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        createdAt: job.createdAt,
      })),
    };
  }

  private verifyTokenOrThrow(token: string) {
    if (!token) {
      throw new BadRequestException('Missing portal access token');
    }

    const payload = verifyCustomerPortalToken(token);

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired portal access token');
    }

    return payload;
  }
}

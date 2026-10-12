import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { type Invoice, InvoiceStatus } from '@prisma/client';

import { type CreateInvoiceDto } from '../dto/create-invoice.dto';
import { type UpdateInvoiceStatusDto } from '../dto/update-invoice-status.dto';
import { BillingService } from '../invoice-manager/billing.service';
import { StripeService, type PaymentLinkResult } from '../stripe-manager/stripe.service';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoiceController {
  constructor(
    private readonly billingService: BillingService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('from-job/:jobId')
  @ApiOperation({ summary: 'Create invoice from completed job' })
  @ApiParam({ name: 'jobId', description: 'Job UUID' })
  @ApiResponse({ status: 201, description: 'Invoice created' })
  @ApiResponse({ status: 400, description: 'Job not completed' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async createFromJob(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: CreateInvoiceDto,
  ): Promise<Invoice> {
    return this.billingService.createInvoiceFromJob(jobId, {
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      autoSend: dto.autoSend,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiQuery({ name: 'status', required: false, enum: InvoiceStatus })
  @ApiResponse({ status: 200, description: 'List of invoices' })
  async findAll(
    @Query('status') status?: InvoiceStatus,
  ): Promise<Invoice[]> {
    return this.billingService.findAllInvoices(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ status: 200, description: 'Invoice found' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Invoice> {
    return this.billingService.findInvoiceById(id);
  }

  @Get('by-customer/:customerId')
  @ApiOperation({ summary: 'Get invoices by customer' })
  @ApiParam({ name: 'customerId', description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: 'Customer invoices' })
  async findByCustomer(
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ): Promise<Invoice[]> {
    return this.billingService.findInvoicesByCustomer(customerId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update invoice status' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceStatusDto,
  ): Promise<Invoice> {
    return this.billingService.updateInvoiceStatus(id, dto.status);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send invoice to customer' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ status: 200, description: 'Invoice sent' })
  async sendInvoice(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Invoice> {
    return this.billingService.sendInvoice(id);
  }

  @Post(':id/mark-paid')
  @ApiOperation({ summary: 'Mark invoice as paid' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ status: 200, description: 'Invoice marked as paid' })
  async markPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('stripePaymentId') stripePaymentId?: string,
  ): Promise<Invoice> {
    return this.billingService.markInvoicePaid(id, stripePaymentId);
  }

  @Post(':id/payment-link')
  @ApiOperation({ summary: 'Generate Stripe payment link for invoice' })
  @ApiParam({ name: 'id', description: 'Invoice UUID' })
  @ApiResponse({ status: 201, description: 'Payment link generated' })
  @ApiResponse({ status: 400, description: 'Invoice already paid or Stripe not configured' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async createPaymentLink(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PaymentLinkResult> {
    return this.stripeService.createPaymentLink(id);
  }

  @Get('payment-status/:paymentIntentId')
  @ApiOperation({ summary: 'Get payment intent status' })
  @ApiParam({ name: 'paymentIntentId', description: 'Stripe Payment Intent ID' })
  @ApiResponse({ status: 200, description: 'Payment status returned' })
  async getPaymentStatus(
    @Param('paymentIntentId') paymentIntentId: string,
  ): Promise<{ status: string }> {
    return this.stripeService.getPaymentStatus(paymentIntentId);
  }
}

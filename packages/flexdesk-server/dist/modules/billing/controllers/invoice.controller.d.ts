import { type Invoice, InvoiceStatus } from '@prisma/client';
import { type CreateInvoiceDto } from '../dto/create-invoice.dto';
import { type UpdateInvoiceStatusDto } from '../dto/update-invoice-status.dto';
import { type BillingService } from '../invoice-manager/billing.service';
import { type StripeService, type PaymentLinkResult } from '../stripe-manager/stripe.service';
export declare class InvoiceController {
    private readonly billingService;
    private readonly stripeService;
    constructor(billingService: BillingService, stripeService: StripeService);
    createFromJob(jobId: string, dto: CreateInvoiceDto): Promise<Invoice>;
    findAll(status?: InvoiceStatus): Promise<Invoice[]>;
    findOne(id: string): Promise<Invoice>;
    findByCustomer(customerId: string): Promise<Invoice[]>;
    updateStatus(id: string, dto: UpdateInvoiceStatusDto): Promise<Invoice>;
    sendInvoice(id: string): Promise<Invoice>;
    markPaid(id: string, stripePaymentId?: string): Promise<Invoice>;
    createPaymentLink(id: string): Promise<PaymentLinkResult>;
    getPaymentStatus(paymentIntentId: string): Promise<{
        status: string;
    }>;
}

import { type InvoiceStatus, type JobStatus } from '@prisma/client';
import { type PrismaService } from '@/core/database/prisma.service';
import { type StripeService, type PaymentLinkResult } from '@/modules/billing/stripe-manager/stripe.service';
import { type CustomerPortalTokenPayload } from '@/utils/crypto';
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
export declare class CustomerPortalService {
    private readonly prisma;
    private readonly stripeService;
    constructor(prisma: PrismaService, stripeService: StripeService);
    generatePortalToken(customerId: string, workspaceId: string, expiryDays?: number): Promise<PortalTokenResult>;
    verifyToken(token: string): CustomerPortalTokenPayload;
    getPortalData(customerId: string, workspaceId: string): Promise<CustomerPortalData>;
    getInvoiceById(invoiceId: string, customerId: string, workspaceId: string): Promise<InvoiceSummary>;
    getJobById(jobId: string, customerId: string, workspaceId: string): Promise<JobSummary>;
    private getCustomerInvoices;
    private getCustomerJobs;
    private mapInvoiceToSummary;
    private mapJobToSummary;
    getInvoicePaymentLink(invoiceId: string, customerId: string, workspaceId: string): Promise<PaymentLinkResult>;
}

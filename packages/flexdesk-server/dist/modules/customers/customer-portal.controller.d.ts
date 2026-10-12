import { type Customer } from '@prisma/client';
import { type PrismaService } from '@/core/database/prisma.service';
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
export declare class CustomerPortalController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    generateToken(customerId: string): Promise<{
        token: string;
        expiresAt: Date;
    }>;
    getInvoices(token: string): Promise<CustomerPortalInvoicesResponse>;
    getInvoiceDetail(invoiceId: string, token: string): Promise<CustomerPortalInvoiceDetailResponse>;
    getJobs(token: string): Promise<CustomerPortalJobsResponse>;
    private verifyTokenOrThrow;
}
export {};

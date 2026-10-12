import { type Invoice, InvoiceStatus } from '@prisma/client';
import { type PrismaService } from '@/core/database/prisma.service';
import { type NotificationService } from '@/modules/notifications/notification.service';
export interface CreateInvoiceFromJobOptions {
    dueDate?: Date;
    autoSend?: boolean;
}
export declare class BillingService {
    private readonly prisma;
    private readonly notificationService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationService: NotificationService);
    private getWorkspaceIdOrThrow;
    findAllInvoices(status?: InvoiceStatus): Promise<Invoice[]>;
    findInvoiceById(id: string): Promise<Invoice>;
    findInvoicesByCustomer(customerId: string): Promise<Invoice[]>;
    updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice>;
    sendInvoice(id: string): Promise<Invoice>;
    markInvoicePaid(id: string, stripePaymentId?: string): Promise<Invoice>;
    createInvoiceFromJob(jobId: string, options?: CreateInvoiceFromJobOptions): Promise<Invoice>;
    private generateInvoiceNumber;
}

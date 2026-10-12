import { type PrismaService } from '@/core/database';
import { type NotificationService } from '@/modules/notifications/notification.service';
export declare class InvoiceGenerationProcessor {
    private readonly prisma;
    private readonly notificationService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationService: NotificationService);
    generateInvoicesForCompletedJobs(): Promise<void>;
    sendPaymentReminders(): Promise<void>;
    sendUpcomingDueReminders(): Promise<void>;
    private createInvoiceForJob;
    private generateInvoiceNumber;
}

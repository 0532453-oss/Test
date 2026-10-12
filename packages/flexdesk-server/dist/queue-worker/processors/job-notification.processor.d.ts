import { type PrismaService } from '@/core/database';
import { type NotificationService } from '@/modules/notifications/notification.service';
export declare class JobNotificationProcessor {
    private readonly prisma;
    private readonly notificationService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationService: NotificationService);
    sendDailyJobReminders(): Promise<void>;
    sendUpcomingJobReminders(): Promise<void>;
    checkOverdueJobs(): Promise<void>;
    checkUnassignedJobs(): Promise<void>;
}

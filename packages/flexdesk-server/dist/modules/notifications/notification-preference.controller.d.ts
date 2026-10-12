import { type UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { type NotificationService } from './notification.service';
import { type PrismaService } from '@/core/database/prisma.service';
export declare class NotificationPreferenceController {
    private readonly notificationService;
    private readonly prisma;
    constructor(notificationService: NotificationService, prisma: PrismaService);
    private getWorkspaceIdOrThrow;
    getPreferences(customerId: string): Promise<{
        customerId: string;
        preferences: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            jobDispatched: boolean;
            jobReminder: boolean;
            jobCompleted: boolean;
            invoiceSent: boolean;
            paymentReceived: boolean;
            estimateSent: boolean;
            estimateFollowUp: boolean;
            marketingMessages: boolean;
            customerId: string;
            emailEnabled: boolean;
            smsEnabled: boolean;
            pushEnabled: boolean;
            reminderHoursBefore: number;
            quietHoursStart: string | null;
            quietHoursEnd: string | null;
        } | Omit<{
            id: string;
            createdAt: Date;
            updatedAt: Date;
            jobDispatched: boolean;
            jobReminder: boolean;
            jobCompleted: boolean;
            invoiceSent: boolean;
            paymentReceived: boolean;
            estimateSent: boolean;
            estimateFollowUp: boolean;
            marketingMessages: boolean;
            customerId: string;
            emailEnabled: boolean;
            smsEnabled: boolean;
            pushEnabled: boolean;
            reminderHoursBefore: number;
            quietHoursStart: string | null;
            quietHoursEnd: string | null;
        }, "id" | "createdAt" | "updatedAt" | "customerId">;
    }>;
    updatePreferences(customerId: string, dto: UpdateNotificationPreferencesDto): Promise<{
        customerId: string;
        preferences: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            jobDispatched: boolean;
            jobReminder: boolean;
            jobCompleted: boolean;
            invoiceSent: boolean;
            paymentReceived: boolean;
            estimateSent: boolean;
            estimateFollowUp: boolean;
            marketingMessages: boolean;
            customerId: string;
            emailEnabled: boolean;
            smsEnabled: boolean;
            pushEnabled: boolean;
            reminderHoursBefore: number;
            quietHoursStart: string | null;
            quietHoursEnd: string | null;
        };
    }>;
    checkNotificationEnabled(customerId: string, notificationType: string, channel: 'email' | 'sms' | 'push'): Promise<{
        customerId: string;
        notificationType: string;
        channel: "push" | "email" | "sms";
        enabled: boolean;
    }>;
}

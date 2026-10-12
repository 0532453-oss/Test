import { type OnModuleInit } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { type Invoice, type Job, type JobStatus, type Customer, type NotificationPreference } from '@prisma/client';
import { type PrismaService } from '@/core/database/prisma.service';
export interface JobStatusChangeEvent {
    jobId: string;
    workspaceId: string;
    previousStatus: JobStatus;
    nextStatus: JobStatus;
    trackingLink?: string;
    invoiceLink?: string;
    timestamp: Date;
}
export interface EmailPayload {
    to: string;
    subject: string;
    template: string;
    context: Record<string, unknown>;
}
export interface SmsPayload {
    to: string;
    message: string;
}
export interface NotificationResult {
    success: boolean;
    channel: 'email' | 'sms' | 'push';
    messageId?: string;
    error?: string;
}
export type NotificationType = 'jobDispatched' | 'jobReminder' | 'jobCompleted' | 'invoiceSent' | 'paymentReceived' | 'estimateSent' | 'estimateFollowUp' | 'marketingMessages';
export interface CustomerWithPreference extends Customer {
    notificationPreference?: NotificationPreference | null;
}
declare const DEFAULT_PREFERENCES: Omit<NotificationPreference, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>;
export declare class NotificationService implements OnModuleInit {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    private readonly publicBaseUrl;
    private readonly sendGridApiKey;
    private readonly fromEmail;
    private readonly fromName;
    private isEmailConfigured;
    private twilioClient;
    private readonly twilioAccountSid;
    private readonly twilioAuthToken;
    private readonly twilioFromNumber;
    private isSmsConfigured;
    constructor(configService: ConfigService, prisma: PrismaService);
    onModuleInit(): void;
    getCustomerPreferences(customerId: string): Promise<NotificationPreference | typeof DEFAULT_PREFERENCES>;
    upsertCustomerPreferences(customerId: string, preferences: Partial<Omit<NotificationPreference, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>>): Promise<NotificationPreference>;
    isNotificationEnabled(customerId: string, notificationType: NotificationType, channel: 'email' | 'sms' | 'push'): Promise<boolean>;
    isWithinQuietHours(prefs: NotificationPreference | typeof DEFAULT_PREFERENCES): boolean;
    sendEmail(payload: EmailPayload): Promise<NotificationResult>;
    private renderEmailTemplate;
    sendSms(payload: SmsPayload): Promise<NotificationResult>;
    sendNotificationWithPreferences(customer: CustomerWithPreference, notificationType: NotificationType, emailPayload: Omit<EmailPayload, 'to'> | null, smsPayload: Omit<SmsPayload, 'to'> | null): Promise<{
        email?: NotificationResult;
        sms?: NotificationResult;
    }>;
    notifyJobDispatched(job: Job, customer: CustomerWithPreference, context: {
        previousStatus: JobStatus;
    }): Promise<JobStatusChangeEvent>;
    notifyJobCompleted(job: Job, customer: CustomerWithPreference, context: {
        previousStatus: JobStatus;
        invoice: Invoice;
    }): Promise<JobStatusChangeEvent>;
    notifyInvoiceSent(invoice: Invoice, customer: CustomerWithPreference): Promise<NotificationResult>;
    notifyPaymentReceived(invoice: Invoice, customer: CustomerWithPreference): Promise<NotificationResult>;
    notifyJobReminder(job: Job, customer: CustomerWithPreference, hoursUntil: number): Promise<NotificationResult>;
    logJobDispatched(job: Job, context: {
        previousStatus: JobStatus;
    }): JobStatusChangeEvent;
    logJobCompleted(job: Job, context: {
        previousStatus: JobStatus;
        invoice: Invoice;
    }): JobStatusChangeEvent;
}
export {};

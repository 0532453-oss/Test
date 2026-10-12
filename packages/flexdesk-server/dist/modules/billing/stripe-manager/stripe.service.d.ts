import { type ConfigService } from '@nestjs/config';
import { type StripeConnectService } from './stripe-connect.service';
import { type StripeSubscriptionService } from './stripe-subscription.service';
import { type PrismaService } from '@/core/database/prisma.service';
import { type NotificationService } from '@/modules/notifications/notification.service';
export interface PaymentLinkResult {
    paymentLinkUrl: string;
    paymentIntentId: string;
    clientSecret: string;
}
export interface WebhookEventResult {
    type: string;
    invoiceId?: string;
    status: 'processed' | 'ignored';
}
export declare class StripeService {
    private readonly configService;
    private readonly prisma;
    private readonly notificationService;
    private readonly stripeConnectService;
    private readonly stripeSubscriptionService;
    private readonly stripe;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService, notificationService: NotificationService, stripeConnectService: StripeConnectService, stripeSubscriptionService: StripeSubscriptionService);
    private getWorkspaceIdOrThrow;
    private ensureStripeConfigured;
    createPaymentLink(invoiceId: string): Promise<PaymentLinkResult>;
    handleWebhook(payload: Buffer, signature: string): Promise<WebhookEventResult>;
    private handlePaymentIntentSucceeded;
    private handlePaymentIntentFailed;
    private handleCheckoutSessionCompleted;
    private handleInvoicePaymentSucceeded;
    private handleInvoicePaymentFailed;
    private handleAccountUpdated;
    getPaymentStatus(paymentIntentId: string): Promise<{
        status: string;
    }>;
    createPaymentLinkForPortal(invoiceId: string, customerId: string, workspaceId: string): Promise<PaymentLinkResult>;
}

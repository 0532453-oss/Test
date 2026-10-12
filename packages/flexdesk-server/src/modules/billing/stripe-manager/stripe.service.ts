import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvoiceStatus } from '@prisma/client';
import Stripe from 'stripe';

import { StripeConnectService } from './stripe-connect.service';
import { StripeSubscriptionService } from './stripe-subscription.service';

import { PrismaService } from '@/core/database/prisma.service';
import { getWorkspaceId } from '@/core/database/workspace-context';
import { NotificationService } from '@/modules/notifications/notification.service';

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

@Injectable()
export class StripeService {
  private readonly stripe: Stripe | null;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly stripeConnectService: StripeConnectService,
    private readonly stripeSubscriptionService: StripeSubscriptionService,
  ) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    if (secretKey) {
      this.stripe = new Stripe(secretKey);
      const webhookSecret = this.configService.get<string>('stripe.webhookSecret');
      if (!webhookSecret) {
        this.logger.warn('STRIPE_SECRET_KEY is set but STRIPE_WEBHOOK_SECRET is not. Webhooks will reject all events.');
      }
    } else {
      this.stripe = null;
      this.logger.warn('Stripe secret key not configured. Payment features will be disabled.');
    }
  }

  private getWorkspaceIdOrThrow(): string {
    const workspaceId = getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Workspace context is required');
    }
    return workspaceId;
  }

  private ensureStripeConfigured(): Stripe {
    if (!this.stripe) {
      throw new ServiceUnavailableException('Billing not configured');
    }
    return this.stripe;
  }

  async createPaymentLink(invoiceId: string): Promise<PaymentLinkResult> {
    const stripe = this.ensureStripeConfigured();
    const workspaceId = this.getWorkspaceIdOrThrow();

    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, workspaceId },
      include: {
        customer: true,
        job: {
          include: {
            technician: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already paid');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Invoice has been cancelled');
    }

    const amountInCents = Math.round(Number(invoice.total) * 100);
    const publicAppUrl = this.configService.get<string>('app.publicAppUrl') || 'http://localhost:3000';

    // Check if this invoice has a technician with a valid Stripe Connect account
    const technician = invoice.job?.technician;
    const hasValidStripeAccount = technician?.stripeAccountId && technician?.stripeChargesEnabled;

    // Calculate platform fee (application_fee_amount) for Stripe Connect split payments
    const platformFeePercent = this.configService.get<number>('stripe.platformFeePercent') || 15;
    const applicationFeeAmount = hasValidStripeAccount
      ? Math.round(amountInCents * (platformFeePercent / 100))
      : undefined;

    // Build payment_intent_data with optional application_fee_amount
    const paymentIntentData: Stripe.Checkout.SessionCreateParams['payment_intent_data'] = {
      metadata: {
        invoiceId: invoice.id,
        workspaceId: invoice.workspaceId,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
      },
      description: `Payment for invoice ${invoice.invoiceNumber}`,
      receipt_email: invoice.customer?.email || undefined,
    };

    // Add application_fee_amount and transfer_data for Stripe Connect split payments
    if (applicationFeeAmount !== undefined && technician?.stripeAccountId) {
      paymentIntentData.application_fee_amount = applicationFeeAmount;
      paymentIntentData.transfer_data = {
        destination: technician.stripeAccountId,
      };
      this.logger.log(
        `Invoice ${invoice.invoiceNumber}: Setting application_fee_amount=${applicationFeeAmount} cents (${platformFeePercent}% of ${amountInCents} cents), transfer_data.destination=${technician.stripeAccountId}`,
      );
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_intent_data: paymentIntentData,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Invoice ${invoice.invoiceNumber}`,
              description: `Payment for services`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${publicAppUrl}/payment/success?invoiceId=${invoice.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${publicAppUrl}/invoices/${invoice.id}?payment=cancelled`,
      customer_email: invoice.customer?.email || undefined,
      metadata: {
        invoiceId: invoice.id,
        workspaceId: invoice.workspaceId,
      },
    });

    return {
      paymentLinkUrl: checkoutSession.url || '',
      paymentIntentId: (checkoutSession.payment_intent as string) || '',
      clientSecret: '',
    };
  }

  async handleWebhook(
    payload: Buffer,
    signature: string,
  ): Promise<WebhookEventResult> {
    const stripe = this.ensureStripeConfigured();
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret');

    if (!webhookSecret) {
      throw new BadRequestException('Stripe webhook secret not configured');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret, 300);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err}`);
      throw new BadRequestException('Webhook signature verification failed');
    }

    this.logger.log(`Received Stripe webhook event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        return this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);

      case 'payment_intent.payment_failed':
        return this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);

      case 'checkout.session.completed':
        return this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);

      case 'customer.subscription.updated':
        await this.stripeSubscriptionService.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        return { type: event.type, status: 'processed' };

      case 'customer.subscription.deleted':
        await this.stripeSubscriptionService.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        return { type: event.type, status: 'processed' };

      case 'invoice.payment_succeeded':
        return this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);

      case 'invoice.payment_failed':
        return this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);

      case 'account.updated':
        return this.handleAccountUpdated(event.data.object as Stripe.Account);

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
        return { type: event.type, status: 'ignored' };
    }
  }

  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<WebhookEventResult> {
    const invoiceId = paymentIntent.metadata?.invoiceId;

    if (!invoiceId) {
      this.logger.warn('Payment intent succeeded but no invoiceId in metadata');
      return { type: 'payment_intent.succeeded', status: 'ignored' };
    }

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
        stripePaymentId: paymentIntent.id,
      },
      include: {
        customer: {
          include: {
            notificationPreference: true,
          },
        },
      },
    });

    this.logger.log(`Invoice ${invoiceId} marked as paid via payment intent ${paymentIntent.id}`);

    // Send payment confirmation email
    if (updatedInvoice.customer) {
      try {
        await this.notificationService.notifyPaymentReceived(
          updatedInvoice,
          updatedInvoice.customer,
        );
        this.logger.log(`Payment confirmation sent for invoice ${updatedInvoice.invoiceNumber}`);
      } catch (error) {
        this.logger.error(`Failed to send payment confirmation: ${error}`);
        // Don't fail the webhook if notification fails
      }
    }

    return {
      type: 'payment_intent.succeeded',
      invoiceId,
      status: 'processed',
    };
  }

  private async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<WebhookEventResult> {
    const invoiceId = paymentIntent.metadata?.invoiceId;

    if (!invoiceId) {
      this.logger.warn('Payment intent failed but no invoiceId in metadata');
      return { type: 'payment_intent.payment_failed', status: 'ignored' };
    }

    this.logger.warn(`Payment failed for invoice ${invoiceId}: ${paymentIntent.last_payment_error?.message}`);

    return {
      type: 'payment_intent.payment_failed',
      invoiceId,
      status: 'processed',
    };
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<WebhookEventResult> {
    const invoiceId = session.metadata?.invoiceId;

    if (!invoiceId) {
      this.logger.warn('Checkout session completed but no invoiceId in metadata');
      return { type: 'checkout.session.completed', status: 'ignored' };
    }

    if (session.payment_status === 'paid') {
      const updatedInvoice = await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.PAID,
          paidAt: new Date(),
          stripePaymentId: session.payment_intent as string,
        },
        include: {
          customer: {
            include: {
              notificationPreference: true,
            },
          },
        },
      });

      this.logger.log(`Invoice ${invoiceId} marked as paid via checkout session`);

      // Send payment confirmation email
      if (updatedInvoice.customer) {
        try {
          await this.notificationService.notifyPaymentReceived(
            updatedInvoice,
            updatedInvoice.customer,
          );
          this.logger.log(`Payment confirmation sent for invoice ${updatedInvoice.invoiceNumber}`);
        } catch (error) {
          this.logger.error(`Failed to send payment confirmation: ${error}`);
          // Don't fail the webhook if notification fails
        }
      }
    }

    return {
      type: 'checkout.session.completed',
      invoiceId,
      status: 'processed',
    };
  }

  /**
   * Handle invoice.payment_succeeded webhook event.
   * Updates the related Invoice record to PAID status (idempotent).
   * For subscription invoices, refreshes workspace subscription period.
   */
  private async handleInvoicePaymentSucceeded(
    stripeInvoice: Stripe.Invoice,
  ): Promise<WebhookEventResult> {
    // Handle subscription invoices: refresh subscription period end
    const subscriptionId = stripeInvoice.subscription;
    if (subscriptionId && typeof subscriptionId === 'string') {
      try {
        const stripe = this.ensureStripeConfigured();
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await this.stripeSubscriptionService.handleSubscriptionUpdated(subscription);
        this.logger.log(`Refreshed subscription ${subscriptionId} via invoice.payment_succeeded`);
      } catch (error) {
        this.logger.error(`Failed to refresh subscription ${subscriptionId}: ${error}`);
      }
    }

    const invoiceId = stripeInvoice.metadata?.invoiceId;

    if (!invoiceId) {
      // Subscription-only invoice with no internal invoice mapping
      return {
        type: 'invoice.payment_succeeded',
        status: subscriptionId ? 'processed' : 'ignored',
      };
    }

    // Idempotent: update only if not already PAID
    const existing = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!existing) {
      this.logger.warn(`Invoice ${invoiceId} not found for payment_succeeded event`);
      return { type: 'invoice.payment_succeeded', invoiceId, status: 'ignored' };
    }

    if (existing.status === InvoiceStatus.PAID) {
      this.logger.log(`Invoice ${invoiceId} already marked as PAID (idempotent skip)`);
      return { type: 'invoice.payment_succeeded', invoiceId, status: 'processed' };
    }

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
        stripePaymentId: stripeInvoice.payment_intent as string || undefined,
      },
    });

    this.logger.log(`Invoice ${invoiceId} marked as paid via invoice.payment_succeeded`);

    return {
      type: 'invoice.payment_succeeded',
      invoiceId,
      status: 'processed',
    };
  }

  /**
   * Handle invoice.payment_failed webhook event.
   * Logs the failure with workspace ID and invoice ID for operator visibility.
   */
  private async handleInvoicePaymentFailed(
    stripeInvoice: Stripe.Invoice,
  ): Promise<WebhookEventResult> {
    const invoiceId = stripeInvoice.metadata?.invoiceId;
    const workspaceId = stripeInvoice.metadata?.workspaceId;
    const subscriptionId = stripeInvoice.subscription;

    // Log subscription invoice failures with workspace context
    if (subscriptionId) {
      this.logger.warn(
        `Subscription invoice payment failed: stripeInvoice=${stripeInvoice.id}, subscription=${subscriptionId}, workspace=${workspaceId || 'unknown'}`,
      );
    }

    if (!invoiceId) {
      return {
        type: 'invoice.payment_failed',
        status: subscriptionId ? 'processed' : 'ignored',
      };
    }

    this.logger.warn(
      `Payment failed for invoice ${invoiceId} (workspace=${workspaceId || 'unknown'}): ${stripeInvoice.last_finalization_error?.message || 'unknown reason'}`,
    );

    return {
      type: 'invoice.payment_failed',
      invoiceId,
      status: 'processed',
    };
  }

  /**
   * Handle account.updated webhook events from Stripe Connect.
   * Updates the technician's Stripe status in the database when onboarding is complete.
   */
  private async handleAccountUpdated(
    account: Stripe.Account,
  ): Promise<WebhookEventResult> {
    const technicianId = account.metadata?.technicianId;

    if (!technicianId) {
      this.logger.warn(`Received account.updated for account ${account.id} without technicianId metadata`);
      return { type: 'account.updated', status: 'ignored' };
    }

    try {
      await this.stripeConnectService.handleAccountUpdated(account);
      this.logger.log(
        `Processed account.updated for technician ${technicianId}: charges_enabled=${account.charges_enabled}, details_submitted=${account.details_submitted}`,
      );
      return { type: 'account.updated', status: 'processed' };
    } catch (error) {
      this.logger.error(`Failed to process account.updated for technician ${technicianId}: ${error}`);
      return { type: 'account.updated', status: 'ignored' };
    }
  }

  async getPaymentStatus(paymentIntentId: string): Promise<{ status: string }> {
    const stripe = this.ensureStripeConfigured();

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return { status: paymentIntent.status };
  }

  /**
   * Create a payment link for an invoice from the customer portal.
   * This method does not rely on workspace context and is suitable for public endpoints.
   */
  async createPaymentLinkForPortal(
    invoiceId: string,
    customerId: string,
    workspaceId: string,
  ): Promise<PaymentLinkResult> {
    const stripe = this.ensureStripeConfigured();

    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, customerId, workspaceId },
      include: { customer: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already paid');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Invoice has been cancelled');
    }

    const amountInCents = Math.round(Number(invoice.total) * 100);
    const publicAppUrl = this.configService.get<string>('app.publicAppUrl') || 'http://localhost:3000';

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_intent_data: {
        metadata: {
          invoiceId: invoice.id,
          workspaceId: invoice.workspaceId,
          invoiceNumber: invoice.invoiceNumber,
          customerId: invoice.customerId,
        },
        description: `Payment for invoice ${invoice.invoiceNumber}`,
        receipt_email: invoice.customer?.email || undefined,
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Invoice ${invoice.invoiceNumber}`,
              description: `Payment for services`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${publicAppUrl}/payment/success?invoiceId=${invoice.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${publicAppUrl}/invoices/${invoice.id}?payment=cancelled`,
      customer_email: invoice.customer?.email || undefined,
      metadata: {
        invoiceId: invoice.id,
        workspaceId: invoice.workspaceId,
      },
    });

    return {
      paymentLinkUrl: checkoutSession.url || '',
      paymentIntentId: (checkoutSession.payment_intent as string) || '',
      clientSecret: '',
    };
  }
}

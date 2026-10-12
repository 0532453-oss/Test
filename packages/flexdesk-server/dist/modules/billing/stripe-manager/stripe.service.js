"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StripeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const stripe_1 = require("stripe");
const workspace_context_1 = require("../../../core/database/workspace-context");
let StripeService = StripeService_1 = class StripeService {
    constructor(configService, prisma, notificationService, stripeConnectService, stripeSubscriptionService) {
        this.configService = configService;
        this.prisma = prisma;
        this.notificationService = notificationService;
        this.stripeConnectService = stripeConnectService;
        this.stripeSubscriptionService = stripeSubscriptionService;
        this.logger = new common_1.Logger(StripeService_1.name);
        const secretKey = this.configService.get('stripe.secretKey');
        if (secretKey) {
            this.stripe = new stripe_1.default(secretKey);
        }
        else {
            this.stripe = null;
            this.logger.warn('Stripe secret key not configured. Payment features will be disabled.');
        }
    }
    getWorkspaceIdOrThrow() {
        const workspaceId = (0, workspace_context_1.getWorkspaceId)();
        if (!workspaceId) {
            throw new common_1.BadRequestException('Workspace context is required');
        }
        return workspaceId;
    }
    ensureStripeConfigured() {
        if (!this.stripe) {
            throw new common_1.ServiceUnavailableException('Billing not configured');
        }
        return this.stripe;
    }
    async createPaymentLink(invoiceId) {
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
            throw new common_1.NotFoundException('Invoice not found');
        }
        if (invoice.status === client_1.InvoiceStatus.PAID) {
            throw new common_1.BadRequestException('Invoice is already paid');
        }
        if (invoice.status === client_1.InvoiceStatus.CANCELLED) {
            throw new common_1.BadRequestException('Invoice has been cancelled');
        }
        const amountInCents = Math.round(Number(invoice.total) * 100);
        const publicAppUrl = this.configService.get('app.publicAppUrl') || 'http://localhost:3000';
        const technician = invoice.job?.technician;
        const hasValidStripeAccount = technician?.stripeAccountId && technician?.stripeChargesEnabled;
        const platformFeePercent = this.configService.get('stripe.platformFeePercent') || 15;
        const applicationFeeAmount = hasValidStripeAccount
            ? Math.round(amountInCents * (platformFeePercent / 100))
            : undefined;
        const paymentIntentData = {
            metadata: {
                invoiceId: invoice.id,
                workspaceId: invoice.workspaceId,
                invoiceNumber: invoice.invoiceNumber,
                customerId: invoice.customerId,
            },
            description: `Payment for invoice ${invoice.invoiceNumber}`,
            receipt_email: invoice.customer?.email || undefined,
        };
        if (applicationFeeAmount !== undefined && technician?.stripeAccountId) {
            paymentIntentData.application_fee_amount = applicationFeeAmount;
            paymentIntentData.transfer_data = {
                destination: technician.stripeAccountId,
            };
            this.logger.log(`Invoice ${invoice.invoiceNumber}: Setting application_fee_amount=${applicationFeeAmount} cents (${platformFeePercent}% of ${amountInCents} cents), transfer_data.destination=${technician.stripeAccountId}`);
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
            paymentIntentId: checkoutSession.payment_intent || '',
            clientSecret: '',
        };
    }
    async handleWebhook(payload, signature) {
        const stripe = this.ensureStripeConfigured();
        const webhookSecret = this.configService.get('stripe.webhookSecret');
        if (!webhookSecret) {
            throw new common_1.BadRequestException('Stripe webhook secret not configured');
        }
        let event;
        try {
            event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        }
        catch (err) {
            this.logger.error(`Webhook signature verification failed: ${err}`);
            throw new common_1.BadRequestException('Webhook signature verification failed');
        }
        this.logger.log(`Received Stripe webhook event: ${event.type}`);
        switch (event.type) {
            case 'payment_intent.succeeded':
                return this.handlePaymentIntentSucceeded(event.data.object);
            case 'payment_intent.payment_failed':
                return this.handlePaymentIntentFailed(event.data.object);
            case 'checkout.session.completed':
                return this.handleCheckoutSessionCompleted(event.data.object);
            case 'customer.subscription.updated':
                await this.stripeSubscriptionService.handleSubscriptionUpdated(event.data.object);
                return { type: event.type, status: 'processed' };
            case 'customer.subscription.deleted':
                await this.stripeSubscriptionService.handleSubscriptionDeleted(event.data.object);
                return { type: event.type, status: 'processed' };
            case 'invoice.payment_succeeded':
                return this.handleInvoicePaymentSucceeded(event.data.object);
            case 'invoice.payment_failed':
                return this.handleInvoicePaymentFailed(event.data.object);
            case 'account.updated':
                return this.handleAccountUpdated(event.data.object);
            default:
                this.logger.log(`Unhandled event type: ${event.type}`);
                return { type: event.type, status: 'ignored' };
        }
    }
    async handlePaymentIntentSucceeded(paymentIntent) {
        const invoiceId = paymentIntent.metadata?.invoiceId;
        if (!invoiceId) {
            this.logger.warn('Payment intent succeeded but no invoiceId in metadata');
            return { type: 'payment_intent.succeeded', status: 'ignored' };
        }
        const updatedInvoice = await this.prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                status: client_1.InvoiceStatus.PAID,
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
        if (updatedInvoice.customer) {
            try {
                await this.notificationService.notifyPaymentReceived(updatedInvoice, updatedInvoice.customer);
                this.logger.log(`Payment confirmation sent for invoice ${updatedInvoice.invoiceNumber}`);
            }
            catch (error) {
                this.logger.error(`Failed to send payment confirmation: ${error}`);
            }
        }
        return {
            type: 'payment_intent.succeeded',
            invoiceId,
            status: 'processed',
        };
    }
    async handlePaymentIntentFailed(paymentIntent) {
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
    async handleCheckoutSessionCompleted(session) {
        const invoiceId = session.metadata?.invoiceId;
        if (!invoiceId) {
            this.logger.warn('Checkout session completed but no invoiceId in metadata');
            return { type: 'checkout.session.completed', status: 'ignored' };
        }
        if (session.payment_status === 'paid') {
            const updatedInvoice = await this.prisma.invoice.update({
                where: { id: invoiceId },
                data: {
                    status: client_1.InvoiceStatus.PAID,
                    paidAt: new Date(),
                    stripePaymentId: session.payment_intent,
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
            if (updatedInvoice.customer) {
                try {
                    await this.notificationService.notifyPaymentReceived(updatedInvoice, updatedInvoice.customer);
                    this.logger.log(`Payment confirmation sent for invoice ${updatedInvoice.invoiceNumber}`);
                }
                catch (error) {
                    this.logger.error(`Failed to send payment confirmation: ${error}`);
                }
            }
        }
        return {
            type: 'checkout.session.completed',
            invoiceId,
            status: 'processed',
        };
    }
    async handleInvoicePaymentSucceeded(stripeInvoice) {
        const invoiceId = stripeInvoice.metadata?.invoiceId;
        if (!invoiceId) {
            this.logger.log('Stripe invoice.payment_succeeded has no invoiceId metadata (may be a subscription invoice)');
            return { type: 'invoice.payment_succeeded', status: 'ignored' };
        }
        const existing = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
        });
        if (!existing) {
            this.logger.warn(`Invoice ${invoiceId} not found for payment_succeeded event`);
            return { type: 'invoice.payment_succeeded', invoiceId, status: 'ignored' };
        }
        if (existing.status === client_1.InvoiceStatus.PAID) {
            this.logger.log(`Invoice ${invoiceId} already marked as PAID (idempotent skip)`);
            return { type: 'invoice.payment_succeeded', invoiceId, status: 'processed' };
        }
        await this.prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                status: client_1.InvoiceStatus.PAID,
                paidAt: new Date(),
                stripePaymentId: stripeInvoice.payment_intent || undefined,
            },
        });
        this.logger.log(`Invoice ${invoiceId} marked as paid via invoice.payment_succeeded`);
        return {
            type: 'invoice.payment_succeeded',
            invoiceId,
            status: 'processed',
        };
    }
    async handleInvoicePaymentFailed(stripeInvoice) {
        const invoiceId = stripeInvoice.metadata?.invoiceId;
        if (!invoiceId) {
            this.logger.log('Stripe invoice.payment_failed has no invoiceId metadata (may be a subscription invoice)');
            return { type: 'invoice.payment_failed', status: 'ignored' };
        }
        this.logger.warn(`Payment failed for invoice ${invoiceId}: ${stripeInvoice.last_finalization_error?.message || 'unknown reason'}`);
        return {
            type: 'invoice.payment_failed',
            invoiceId,
            status: 'processed',
        };
    }
    async handleAccountUpdated(account) {
        const technicianId = account.metadata?.technicianId;
        if (!technicianId) {
            this.logger.warn(`Received account.updated for account ${account.id} without technicianId metadata`);
            return { type: 'account.updated', status: 'ignored' };
        }
        try {
            await this.stripeConnectService.handleAccountUpdated(account);
            this.logger.log(`Processed account.updated for technician ${technicianId}: charges_enabled=${account.charges_enabled}, details_submitted=${account.details_submitted}`);
            return { type: 'account.updated', status: 'processed' };
        }
        catch (error) {
            this.logger.error(`Failed to process account.updated for technician ${technicianId}: ${error}`);
            return { type: 'account.updated', status: 'ignored' };
        }
    }
    async getPaymentStatus(paymentIntentId) {
        const stripe = this.ensureStripeConfigured();
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        return { status: paymentIntent.status };
    }
    async createPaymentLinkForPortal(invoiceId, customerId, workspaceId) {
        const stripe = this.ensureStripeConfigured();
        const invoice = await this.prisma.invoice.findFirst({
            where: { id: invoiceId, customerId, workspaceId },
            include: { customer: true },
        });
        if (!invoice) {
            throw new common_1.NotFoundException('Invoice not found');
        }
        if (invoice.status === client_1.InvoiceStatus.PAID) {
            throw new common_1.BadRequestException('Invoice is already paid');
        }
        if (invoice.status === client_1.InvoiceStatus.CANCELLED) {
            throw new common_1.BadRequestException('Invoice has been cancelled');
        }
        const amountInCents = Math.round(Number(invoice.total) * 100);
        const publicAppUrl = this.configService.get('app.publicAppUrl') || 'http://localhost:3000';
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
            paymentIntentId: checkoutSession.payment_intent || '',
            clientSecret: '',
        };
    }
};
exports.StripeService = StripeService;
exports.StripeService = StripeService = StripeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function, Function, Function, Function, Function])
], StripeService);

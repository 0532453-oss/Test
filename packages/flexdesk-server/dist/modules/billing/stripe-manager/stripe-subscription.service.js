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
var StripeSubscriptionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeSubscriptionService = exports.SUBSCRIPTION_TIERS = void 0;
const common_1 = require("@nestjs/common");
const stripe_1 = require("stripe");
exports.SUBSCRIPTION_TIERS = [
    {
        id: 'free',
        name: 'Free',
        description: 'Get started with basic features at no cost',
        monthlyPrice: 0,
        yearlyPrice: 0,
        requiresCheckout: false,
        features: [
            'Up to 2 technicians',
            'Basic job scheduling',
            'Customer management',
            'Invoice generation',
            'Community support',
        ],
    },
    {
        id: 'pro',
        name: 'Pro',
        description: 'For growing businesses that need more power',
        monthlyPrice: 2900,
        yearlyPrice: 27600,
        requiresCheckout: true,
        features: [
            'Unlimited technicians',
            'Advanced scheduling & routing',
            'Customer portal',
            'Recurring jobs',
            'Custom invoicing',
            'Priority email & chat support',
        ],
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Full-featured solution for established service companies',
        monthlyPrice: 0,
        yearlyPrice: 0,
        isCustomPricing: true,
        requiresCheckout: false,
        features: [
            'Everything in Pro',
            'Route optimization',
            'Advanced analytics & reporting',
            'API access',
            'Custom integrations',
            'Dedicated account manager',
            '24/7 phone support',
        ],
    },
];
let StripeSubscriptionService = StripeSubscriptionService_1 = class StripeSubscriptionService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(StripeSubscriptionService_1.name);
        const secretKey = this.configService.get('stripe.secretKey');
        if (secretKey) {
            this.stripe = new stripe_1.default(secretKey);
        }
        else {
            this.stripe = null;
            this.logger.warn('Stripe secret key not configured. Subscription features will be disabled.');
        }
    }
    ensureStripeConfigured() {
        if (!this.stripe) {
            throw new common_1.ServiceUnavailableException('Billing not configured');
        }
        return this.stripe;
    }
    getSubscriptionTiers() {
        return exports.SUBSCRIPTION_TIERS;
    }
    getSubscriptionTier(tierId) {
        return exports.SUBSCRIPTION_TIERS.find((tier) => tier.id === tierId);
    }
    async createOrGetProduct(tier) {
        const stripe = this.ensureStripeConfigured();
        const existingProducts = await stripe.products.search({
            query: `metadata['tier_id']:'${tier.id}'`,
        });
        if (existingProducts.data.length > 0) {
            this.logger.log(`Found existing Stripe product for tier ${tier.id}: ${existingProducts.data[0].id}`);
            return existingProducts.data[0];
        }
        const product = await stripe.products.create({
            name: `ServiceFlex ${tier.name}`,
            description: tier.description,
            metadata: {
                tier_id: tier.id,
                platform: 'serviceflex',
            },
        });
        this.logger.log(`Created Stripe product for tier ${tier.id}: ${product.id}`);
        return product;
    }
    async createOrGetPrices(tier, productId) {
        const stripe = this.ensureStripeConfigured();
        const existingMonthlyPrices = await stripe.prices.search({
            query: `product:'${productId}' metadata['tier_id']:'${tier.id}' metadata['interval']:'month'`,
        });
        let monthlyPriceId;
        if (existingMonthlyPrices.data.length > 0 && existingMonthlyPrices.data[0].active) {
            monthlyPriceId = existingMonthlyPrices.data[0].id;
            this.logger.log(`Found existing monthly price for tier ${tier.id}: ${monthlyPriceId}`);
        }
        else {
            const monthlyPrice = await stripe.prices.create({
                product: productId,
                unit_amount: tier.monthlyPrice,
                currency: 'usd',
                recurring: {
                    interval: 'month',
                },
                metadata: {
                    tier_id: tier.id,
                    interval: 'month',
                    platform: 'serviceflex',
                },
            });
            monthlyPriceId = monthlyPrice.id;
            this.logger.log(`Created monthly price for tier ${tier.id}: ${monthlyPriceId}`);
        }
        const existingYearlyPrices = await stripe.prices.search({
            query: `product:'${productId}' metadata['tier_id']:'${tier.id}' metadata['interval']:'year'`,
        });
        let yearlyPriceId;
        if (existingYearlyPrices.data.length > 0 && existingYearlyPrices.data[0].active) {
            yearlyPriceId = existingYearlyPrices.data[0].id;
            this.logger.log(`Found existing yearly price for tier ${tier.id}: ${yearlyPriceId}`);
        }
        else {
            const yearlyPrice = await stripe.prices.create({
                product: productId,
                unit_amount: tier.yearlyPrice,
                currency: 'usd',
                recurring: {
                    interval: 'year',
                },
                metadata: {
                    tier_id: tier.id,
                    interval: 'year',
                    platform: 'serviceflex',
                },
            });
            yearlyPriceId = yearlyPrice.id;
            this.logger.log(`Created yearly price for tier ${tier.id}: ${yearlyPriceId}`);
        }
        return { monthlyPriceId, yearlyPriceId };
    }
    async initializeSubscriptionProducts() {
        const stripe = this.ensureStripeConfigured();
        const results = [];
        for (const tier of exports.SUBSCRIPTION_TIERS) {
            try {
                const product = await this.createOrGetProduct(tier);
                const prices = await this.createOrGetPrices(tier, product.id);
                results.push({
                    ...tier,
                    stripeProductId: product.id,
                    stripeMonthlyPriceId: prices.monthlyPriceId,
                    stripeYearlyPriceId: prices.yearlyPriceId,
                });
                this.logger.log(`Initialized tier ${tier.id}: product=${product.id}, monthly=${prices.monthlyPriceId}, yearly=${prices.yearlyPriceId}`);
            }
            catch (error) {
                this.logger.error(`Failed to initialize tier ${tier.id}: ${error}`);
                throw error;
            }
        }
        return results;
    }
    async getSubscriptionProductsWithPrices() {
        const stripe = this.ensureStripeConfigured();
        const results = [];
        for (const tier of exports.SUBSCRIPTION_TIERS) {
            const tierWithStripe = { ...tier };
            try {
                const products = await stripe.products.search({
                    query: `metadata['tier_id']:'${tier.id}'`,
                });
                if (products.data.length > 0) {
                    const product = products.data[0];
                    tierWithStripe.stripeProductId = product.id;
                    const monthlyPrices = await stripe.prices.search({
                        query: `product:'${product.id}' metadata['interval']:'month'`,
                    });
                    if (monthlyPrices.data.length > 0) {
                        tierWithStripe.stripeMonthlyPriceId = monthlyPrices.data[0].id;
                    }
                    const yearlyPrices = await stripe.prices.search({
                        query: `product:'${product.id}' metadata['interval']:'year'`,
                    });
                    if (yearlyPrices.data.length > 0) {
                        tierWithStripe.stripeYearlyPriceId = yearlyPrices.data[0].id;
                    }
                }
            }
            catch (error) {
                this.logger.warn(`Failed to fetch Stripe data for tier ${tier.id}: ${error}`);
            }
            results.push(tierWithStripe);
        }
        return results;
    }
    async getPriceId(tierId, interval) {
        const tier = this.getSubscriptionTier(tierId);
        if (!tier) {
            throw new common_1.NotFoundException(`Subscription tier ${tierId} not found`);
        }
        const stripe = this.ensureStripeConfigured();
        const products = await stripe.products.search({
            query: `metadata['tier_id']:'${tierId}'`,
        });
        if (products.data.length === 0) {
            throw new common_1.NotFoundException(`Stripe product for tier ${tierId} not found. Please initialize products first.`);
        }
        const productId = products.data[0].id;
        const prices = await stripe.prices.search({
            query: `product:'${productId}' metadata['interval']:'${interval}'`,
        });
        if (prices.data.length === 0 || !prices.data[0].active) {
            throw new common_1.NotFoundException(`Stripe price for tier ${tierId} (${interval}) not found. Please initialize products first.`);
        }
        return prices.data[0].id;
    }
    async createOrGetCustomer(workspaceId, email, name) {
        const stripe = this.ensureStripeConfigured();
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId },
        });
        if (!workspace) {
            throw new common_1.NotFoundException(`Workspace ${workspaceId} not found`);
        }
        if (workspace.stripeCustomerId) {
            const customer = await stripe.customers.retrieve(workspace.stripeCustomerId);
            if (customer.deleted) {
                this.logger.warn(`Stripe customer ${workspace.stripeCustomerId} was deleted, creating new one`);
            }
            else {
                this.logger.log(`Found existing Stripe customer for workspace ${workspaceId}: ${workspace.stripeCustomerId}`);
                return customer;
            }
        }
        const customer = await stripe.customers.create({
            email,
            name: name || workspace.name,
            metadata: {
                workspace_id: workspaceId,
                platform: 'serviceflex',
            },
        });
        await this.prisma.workspace.update({
            where: { id: workspaceId },
            data: { stripeCustomerId: customer.id },
        });
        this.logger.log(`Created Stripe customer for workspace ${workspaceId}: ${customer.id}`);
        return customer;
    }
    async createSubscription(workspaceId, tierId, interval, email, paymentMethodId) {
        const tier = this.getSubscriptionTier(tierId);
        if (!tier) {
            throw new common_1.NotFoundException(`Subscription tier ${tierId} not found`);
        }
        const stripe = this.ensureStripeConfigured();
        const customer = await this.createOrGetCustomer(workspaceId, email);
        if (paymentMethodId) {
            await stripe.paymentMethods.attach(paymentMethodId, {
                customer: customer.id,
            });
            await stripe.customers.update(customer.id, {
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
            });
        }
        const priceId = await this.getPriceId(tierId, interval);
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId },
        });
        if (workspace?.stripeSubscriptionId) {
            try {
                const existingSubscription = await stripe.subscriptions.retrieve(workspace.stripeSubscriptionId);
                if (existingSubscription.status === 'active' ||
                    existingSubscription.status === 'trialing') {
                    throw new common_1.BadRequestException('Workspace already has an active subscription. Please cancel the existing subscription first or use the billing portal to make changes.');
                }
            }
            catch (error) {
                if (error instanceof common_1.BadRequestException) {
                    throw error;
                }
                this.logger.warn(`Existing subscription ${workspace.stripeSubscriptionId} not found, creating new one`);
            }
        }
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: {
                save_default_payment_method: 'on_subscription',
            },
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                workspace_id: workspaceId,
                tier_id: tierId,
                interval,
                platform: 'serviceflex',
            },
        });
        await this.prisma.workspace.update({
            where: { id: workspaceId },
            data: {
                stripeSubscriptionId: subscription.id,
                subscriptionTier: tierId,
                subscriptionStatus: subscription.status,
                subscriptionInterval: interval,
                subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
        });
        this.logger.log(`Created subscription for workspace ${workspaceId}: ${subscription.id} (${tierId}/${interval})`);
        return subscription;
    }
    async getWorkspaceSubscription(workspaceId) {
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId },
        });
        if (!workspace) {
            throw new common_1.NotFoundException(`Workspace ${workspaceId} not found`);
        }
        if (!workspace.stripeSubscriptionId) {
            return { subscription: null, tier: null };
        }
        const stripe = this.ensureStripeConfigured();
        try {
            const subscription = await stripe.subscriptions.retrieve(workspace.stripeSubscriptionId);
            const tier = workspace.subscriptionTier
                ? this.getSubscriptionTier(workspace.subscriptionTier)
                : null;
            return { subscription, tier: tier || null };
        }
        catch (error) {
            this.logger.warn(`Failed to retrieve subscription ${workspace.stripeSubscriptionId}: ${error}`);
            return { subscription: null, tier: null };
        }
    }
    async cancelSubscription(workspaceId, cancelAtPeriodEnd = true) {
        const stripe = this.ensureStripeConfigured();
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId },
        });
        if (!workspace) {
            throw new common_1.NotFoundException(`Workspace ${workspaceId} not found`);
        }
        if (!workspace.stripeSubscriptionId) {
            throw new common_1.BadRequestException('Workspace does not have an active subscription');
        }
        const subscription = await stripe.subscriptions.update(workspace.stripeSubscriptionId, {
            cancel_at_period_end: cancelAtPeriodEnd,
        });
        await this.prisma.workspace.update({
            where: { id: workspaceId },
            data: {
                subscriptionStatus: cancelAtPeriodEnd ? 'canceling' : 'canceled',
            },
        });
        this.logger.log(`Canceled subscription for workspace ${workspaceId}: ${subscription.id} (cancel_at_period_end: ${cancelAtPeriodEnd})`);
        return subscription;
    }
    async handleSubscriptionUpdated(subscription) {
        const workspaceId = subscription.metadata?.workspace_id;
        if (!workspaceId) {
            this.logger.warn(`Subscription ${subscription.id} has no workspace_id metadata`);
            return;
        }
        const tierId = subscription.metadata?.tier_id;
        await this.prisma.workspace.update({
            where: { id: workspaceId },
            data: {
                subscriptionStatus: subscription.status,
                subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
                ...(tierId && { subscriptionTier: tierId }),
            },
        });
        this.logger.log(`Updated subscription status for workspace ${workspaceId}: ${subscription.status}${tierId ? `, tier: ${tierId}` : ''}`);
    }
    async handleSubscriptionDeleted(subscription) {
        const workspaceId = subscription.metadata?.workspace_id;
        if (!workspaceId) {
            this.logger.warn(`Subscription ${subscription.id} has no workspace_id metadata`);
            return;
        }
        await this.prisma.workspace.update({
            where: { id: workspaceId },
            data: {
                stripeSubscriptionId: null,
                subscriptionStatus: 'canceled',
                subscriptionTier: null,
                subscriptionInterval: null,
                subscriptionCurrentPeriodEnd: null,
            },
        });
        this.logger.log(`Subscription deleted for workspace ${workspaceId}`);
    }
    async createBillingPortalSession(workspaceId, returnUrl) {
        const stripe = this.ensureStripeConfigured();
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId },
        });
        if (!workspace) {
            throw new common_1.NotFoundException(`Workspace ${workspaceId} not found`);
        }
        if (!workspace.stripeCustomerId) {
            throw new common_1.BadRequestException('Workspace does not have a Stripe customer. Please create a subscription first.');
        }
        const session = await stripe.billingPortal.sessions.create({
            customer: workspace.stripeCustomerId,
            return_url: returnUrl,
        });
        this.logger.log(`Created billing portal session for workspace ${workspaceId}: ${session.id}`);
        return session;
    }
    async createCheckoutSession(tierId, interval, successUrl, cancelUrl, email) {
        const tier = this.getSubscriptionTier(tierId);
        if (!tier) {
            throw new common_1.NotFoundException(`Subscription tier ${tierId} not found`);
        }
        if (tier.id === 'free' || tier.requiresCheckout === false) {
            throw new common_1.BadRequestException(`Tier "${tier.name}" does not require checkout. Redirect to signup directly.`);
        }
        if (tier.isCustomPricing) {
            throw new common_1.BadRequestException(`Tier "${tier.name}" has custom pricing. Please contact sales.`);
        }
        const stripe = this.ensureStripeConfigured();
        const priceId = await this.getPriceId(tierId, interval);
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            ...(email && { customer_email: email }),
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                tier_id: tierId,
                interval,
                platform: 'serviceflex',
            },
            subscription_data: {
                metadata: {
                    tier_id: tierId,
                    interval,
                    platform: 'serviceflex',
                },
            },
        });
        this.logger.log(`Created checkout session for tier ${tierId}/${interval}: ${session.id}`);
        return {
            sessionId: session.id,
            url: session.url,
        };
    }
};
exports.StripeSubscriptionService = StripeSubscriptionService;
exports.StripeSubscriptionService = StripeSubscriptionService = StripeSubscriptionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function, Function])
], StripeSubscriptionService);

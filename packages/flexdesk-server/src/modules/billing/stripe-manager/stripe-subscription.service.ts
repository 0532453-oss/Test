import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

import { PrismaService } from '@/core/database/prisma.service';

/**
 * Subscription tier definitions for ServiceFlex platform
 */
export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number; // in cents
  yearlyPrice: number; // in cents (with discount)
  features: string[];
  isCustomPricing?: boolean; // For enterprise tiers with custom pricing
  requiresCheckout?: boolean; // Whether checkout is required (false for free tier)
}

export interface StripeProductPrice {
  productId: string;
  monthlyPriceId: string;
  yearlyPriceId: string;
}

export interface SubscriptionTierWithStripe extends SubscriptionTier {
  stripeProductId?: string;
  stripeMonthlyPriceId?: string;
  stripeYearlyPriceId?: string;
}

/**
 * Default subscription tiers for ServiceFlex platform
 */
export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
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
    monthlyPrice: 2900, // $29/month
    yearlyPrice: 27600, // $23/month billed annually ($276/year)
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

@Injectable()
export class StripeSubscriptionService {
  private readonly stripe: Stripe | null;
  private readonly logger = new Logger(StripeSubscriptionService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    if (secretKey) {
      this.stripe = new Stripe(secretKey);
    } else {
      this.stripe = null;
      this.logger.warn('Stripe secret key not configured. Subscription features will be disabled.');
    }
  }

  private ensureStripeConfigured(): Stripe {
    if (!this.stripe) {
      throw new ServiceUnavailableException('Billing not configured');
    }
    return this.stripe;
  }

  /**
   * Get all available subscription tiers
   */
  getSubscriptionTiers(): SubscriptionTier[] {
    return SUBSCRIPTION_TIERS;
  }

  /**
   * Get a specific subscription tier by ID
   */
  getSubscriptionTier(tierId: string): SubscriptionTier | undefined {
    return SUBSCRIPTION_TIERS.find((tier) => tier.id === tierId);
  }

  /**
   * Create or retrieve a Stripe Product for a subscription tier
   */
  async createOrGetProduct(tier: SubscriptionTier): Promise<Stripe.Product> {
    const stripe = this.ensureStripeConfigured();

    // Search for existing product by metadata
    const existingProducts = await stripe.products.search({
      query: `metadata['tier_id']:'${tier.id}'`,
    });

    if (existingProducts.data.length > 0) {
      this.logger.log(`Found existing Stripe product for tier ${tier.id}: ${existingProducts.data[0].id}`);
      return existingProducts.data[0];
    }

    // Create new product
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

  /**
   * Create or retrieve Stripe Prices for a subscription tier
   */
  async createOrGetPrices(
    tier: SubscriptionTier,
    productId: string,
  ): Promise<{ monthlyPriceId: string; yearlyPriceId: string }> {
    const stripe = this.ensureStripeConfigured();

    // Search for existing monthly price
    const existingMonthlyPrices = await stripe.prices.search({
      query: `product:'${productId}' metadata['tier_id']:'${tier.id}' metadata['interval']:'month'`,
    });

    let monthlyPriceId: string;
    if (existingMonthlyPrices.data.length > 0 && existingMonthlyPrices.data[0].active) {
      monthlyPriceId = existingMonthlyPrices.data[0].id;
      this.logger.log(`Found existing monthly price for tier ${tier.id}: ${monthlyPriceId}`);
    } else {
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

    // Search for existing yearly price
    const existingYearlyPrices = await stripe.prices.search({
      query: `product:'${productId}' metadata['tier_id']:'${tier.id}' metadata['interval']:'year'`,
    });

    let yearlyPriceId: string;
    if (existingYearlyPrices.data.length > 0 && existingYearlyPrices.data[0].active) {
      yearlyPriceId = existingYearlyPrices.data[0].id;
      this.logger.log(`Found existing yearly price for tier ${tier.id}: ${yearlyPriceId}`);
    } else {
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

  /**
   * Initialize all subscription products and prices in Stripe
   * This is idempotent - can be called multiple times safely
   */
  async initializeSubscriptionProducts(): Promise<SubscriptionTierWithStripe[]> {
    const stripe = this.ensureStripeConfigured();
    const results: SubscriptionTierWithStripe[] = [];

    for (const tier of SUBSCRIPTION_TIERS) {
      try {
        const product = await this.createOrGetProduct(tier);
        const prices = await this.createOrGetPrices(tier, product.id);

        results.push({
          ...tier,
          stripeProductId: product.id,
          stripeMonthlyPriceId: prices.monthlyPriceId,
          stripeYearlyPriceId: prices.yearlyPriceId,
        });

        this.logger.log(
          `Initialized tier ${tier.id}: product=${product.id}, monthly=${prices.monthlyPriceId}, yearly=${prices.yearlyPriceId}`,
        );
      } catch (error) {
        this.logger.error(`Failed to initialize tier ${tier.id}: ${error}`);
        throw error;
      }
    }

    return results;
  }

  /**
   * Get all subscription products with their Stripe IDs
   */
  async getSubscriptionProductsWithPrices(): Promise<SubscriptionTierWithStripe[]> {
    const stripe = this.ensureStripeConfigured();
    const results: SubscriptionTierWithStripe[] = [];

    for (const tier of SUBSCRIPTION_TIERS) {
      const tierWithStripe: SubscriptionTierWithStripe = { ...tier };

      try {
        // Search for product
        const products = await stripe.products.search({
          query: `metadata['tier_id']:'${tier.id}'`,
        });

        if (products.data.length > 0) {
          const product = products.data[0];
          tierWithStripe.stripeProductId = product.id;

          // Search for prices
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
      } catch (error) {
        this.logger.warn(`Failed to fetch Stripe data for tier ${tier.id}: ${error}`);
      }

      results.push(tierWithStripe);
    }

    return results;
  }

  /**
   * Get a price ID for a specific tier and billing interval
   */
  async getPriceId(tierId: string, interval: 'month' | 'year'): Promise<string> {
    // Check tier first (doesn't require Stripe)
    const tier = this.getSubscriptionTier(tierId);
    if (!tier) {
      throw new NotFoundException(`Subscription tier ${tierId} not found`);
    }

    const stripe = this.ensureStripeConfigured();

    // Search for existing product
    const products = await stripe.products.search({
      query: `metadata['tier_id']:'${tierId}'`,
    });

    if (products.data.length === 0) {
      throw new NotFoundException(`Stripe product for tier ${tierId} not found. Please initialize products first.`);
    }

    const productId = products.data[0].id;

    // Search for price
    const prices = await stripe.prices.search({
      query: `product:'${productId}' metadata['interval']:'${interval}'`,
    });

    if (prices.data.length === 0 || !prices.data[0].active) {
      throw new NotFoundException(`Stripe price for tier ${tierId} (${interval}) not found. Please initialize products first.`);
    }

    return prices.data[0].id;
  }

  /**
   * Create or retrieve a Stripe Customer for a workspace
   */
  async createOrGetCustomer(
    workspaceId: string,
    email: string,
    name?: string,
  ): Promise<Stripe.Customer> {
    const stripe = this.ensureStripeConfigured();

    // Check if workspace already has a Stripe customer
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }

    if (workspace.stripeCustomerId) {
      // Return existing customer
      const customer = await stripe.customers.retrieve(workspace.stripeCustomerId);
      if (customer.deleted) {
        // Customer was deleted in Stripe, create a new one
        this.logger.warn(`Stripe customer ${workspace.stripeCustomerId} was deleted, creating new one`);
      } else {
        this.logger.log(`Found existing Stripe customer for workspace ${workspaceId}: ${workspace.stripeCustomerId}`);
        return customer as Stripe.Customer;
      }
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name: name || workspace.name,
      metadata: {
        workspace_id: workspaceId,
        platform: 'serviceflex',
      },
    });

    // Update workspace with customer ID
    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { stripeCustomerId: customer.id },
    });

    this.logger.log(`Created Stripe customer for workspace ${workspaceId}: ${customer.id}`);
    return customer;
  }

  /**
   * Create a subscription for a workspace
   */
  async createSubscription(
    workspaceId: string,
    tierId: string,
    interval: 'month' | 'year',
    email: string,
    paymentMethodId?: string,
  ): Promise<Stripe.Subscription> {
    // Validate tier exists first (doesn't require Stripe)
    const tier = this.getSubscriptionTier(tierId);
    if (!tier) {
      throw new NotFoundException(`Subscription tier ${tierId} not found`);
    }

    const stripe = this.ensureStripeConfigured();

    // Get or create customer
    const customer = await this.createOrGetCustomer(workspaceId, email);

    // Attach payment method if provided
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });

      // Set as default payment method
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Get price ID for the tier and interval
    const priceId = await this.getPriceId(tierId, interval);

    // Check if workspace already has an active subscription
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (workspace?.stripeSubscriptionId) {
      // Check if subscription is still active
      try {
        const existingSubscription = await stripe.subscriptions.retrieve(
          workspace.stripeSubscriptionId,
        );
        if (
          existingSubscription.status === 'active' ||
          existingSubscription.status === 'trialing'
        ) {
          throw new BadRequestException(
            'Workspace already has an active subscription. Please cancel the existing subscription first or use the billing portal to make changes.',
          );
        }
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        // Subscription doesn't exist or was deleted, proceed with creating new one
        this.logger.warn(`Existing subscription ${workspace.stripeSubscriptionId} not found, creating new one`);
      }
    }

    // Create the subscription
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

    // Update workspace with subscription details
    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        stripeSubscriptionId: subscription.id,
        subscriptionTier: tierId,
        subscriptionStatus: subscription.status,
        subscriptionInterval: interval,
        subscriptionCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000,
        ),
      },
    });

    this.logger.log(
      `Created subscription for workspace ${workspaceId}: ${subscription.id} (${tierId}/${interval})`,
    );

    return subscription;
  }

  /**
   * Get the current subscription for a workspace
   */
  async getWorkspaceSubscription(workspaceId: string): Promise<{
    subscription: Stripe.Subscription | null;
    tier: SubscriptionTier | null;
  }> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }

    if (!workspace.stripeSubscriptionId) {
      return { subscription: null, tier: null };
    }

    const stripe = this.ensureStripeConfigured();

    try {
      const subscription = await stripe.subscriptions.retrieve(
        workspace.stripeSubscriptionId,
      );

      const tier = workspace.subscriptionTier
        ? this.getSubscriptionTier(workspace.subscriptionTier)
        : null;

      return { subscription, tier: tier || null };
    } catch (error) {
      this.logger.warn(
        `Failed to retrieve subscription ${workspace.stripeSubscriptionId}: ${error}`,
      );
      return { subscription: null, tier: null };
    }
  }

  /**
   * Cancel a workspace's subscription
   */
  async cancelSubscription(
    workspaceId: string,
    cancelAtPeriodEnd: boolean = true,
  ): Promise<Stripe.Subscription> {
    const stripe = this.ensureStripeConfigured();

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }

    if (!workspace.stripeSubscriptionId) {
      throw new BadRequestException('Workspace does not have an active subscription');
    }

    const subscription = await stripe.subscriptions.update(
      workspace.stripeSubscriptionId,
      {
        cancel_at_period_end: cancelAtPeriodEnd,
      },
    );

    // Update workspace subscription status
    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        subscriptionStatus: cancelAtPeriodEnd ? 'canceling' : 'canceled',
      },
    });

    this.logger.log(
      `Canceled subscription for workspace ${workspaceId}: ${subscription.id} (cancel_at_period_end: ${cancelAtPeriodEnd})`,
    );

    return subscription;
  }

  /**
   * Handle subscription webhook events to keep database in sync
   */
  async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
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
        subscriptionCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000,
        ),
        ...(tierId && { subscriptionTier: tierId }),
      },
    });

    this.logger.log(
      `Updated subscription status for workspace ${workspaceId}: ${subscription.status}${tierId ? `, tier: ${tierId}` : ''}`,
    );
  }

  /**
   * Handle subscription deleted webhook events
   */
  async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
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

  /**
   * Create a Stripe Billing Portal session for a workspace
   * This allows users to manage their subscription, update payment methods, and view invoices
   */
  async createBillingPortalSession(
    workspaceId: string,
    returnUrl: string,
  ): Promise<Stripe.BillingPortal.Session> {
    const stripe = this.ensureStripeConfigured();

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`);
    }

    if (!workspace.stripeCustomerId) {
      throw new BadRequestException(
        'Workspace does not have a Stripe customer. Please create a subscription first.',
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: workspace.stripeCustomerId,
      return_url: returnUrl,
    });

    this.logger.log(
      `Created billing portal session for workspace ${workspaceId}: ${session.id}`,
    );

    return session;
  }

  /**
   * Create a Stripe Checkout session for new subscriptions (public, pre-signup)
   * This is used for the website checkout flow before the user creates an account
   * Email is optional - if not provided, Stripe will collect it during checkout
   */
  async createCheckoutSession(
    tierId: string,
    interval: 'month' | 'year',
    successUrl: string,
    cancelUrl: string,
    email?: string,
  ): Promise<{ sessionId: string; url: string }> {
    // Validate tier
    const tier = this.getSubscriptionTier(tierId);
    if (!tier) {
      throw new NotFoundException(`Subscription tier ${tierId} not found`);
    }

    // Reject free tier (no checkout needed)
    if (tier.id === 'free' || tier.requiresCheckout === false) {
      throw new BadRequestException(
        `Tier "${tier.name}" does not require checkout. Redirect to signup directly.`,
      );
    }

    // Reject enterprise tier (custom pricing, contact sales)
    if (tier.isCustomPricing) {
      throw new BadRequestException(
        `Tier "${tier.name}" has custom pricing. Please contact sales.`,
      );
    }

    const stripe = this.ensureStripeConfigured();

    // Get the price ID for this tier and interval
    const priceId = await this.getPriceId(tierId, interval);

    // Create checkout session
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

    this.logger.log(
      `Created checkout session for tier ${tierId}/${interval}: ${session.id}`,
    );

    return {
      sessionId: session.id,
      url: session.url!,
    };
  }
}

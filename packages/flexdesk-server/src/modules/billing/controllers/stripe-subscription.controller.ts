import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { type BillingPortalDto } from '../dto/billing-portal.dto';
import { type CreateCheckoutSessionDto } from '../dto/create-checkout-session.dto';
import { type CreateSubscriptionDto } from '../dto/create-subscription.dto';
import {
  type StripeSubscriptionService,
  type SubscriptionTier,
  type SubscriptionTierWithStripe,
} from '../stripe-manager/stripe-subscription.service';

import { Public } from '@/modules/auth/decorators/public.decorator';
import { Roles } from '@/modules/auth/decorators/roles.decorator';

interface SubscriptionResponse {
  subscriptionId: string;
  status: string;
  clientSecret?: string;
  tier: SubscriptionTier;
  interval: string;
  currentPeriodEnd: string;
}

@Controller('api/v1/subscriptions')
export class StripeSubscriptionController {
  constructor(
    private readonly stripeSubscriptionService: StripeSubscriptionService,
  ) {}

  /**
   * Get all available subscription tiers (public endpoint)
   */
  @Public()
  @Get('tiers')
  async getSubscriptionTiers(): Promise<SubscriptionTier[]> {
    return this.stripeSubscriptionService.getSubscriptionTiers();
  }

  /**
   * Get a specific subscription tier by ID (public endpoint)
   */
  @Public()
  @Get('tiers/:tierId')
  async getSubscriptionTier(
    @Param('tierId') tierId: string,
  ): Promise<SubscriptionTier> {
    const tier = this.stripeSubscriptionService.getSubscriptionTier(tierId);
    if (!tier) {
      throw new Error(`Subscription tier ${tierId} not found`);
    }
    return tier;
  }

  /**
   * Create a Stripe Checkout session for new subscriptions (public endpoint)
   * Used for the website checkout flow before user creates an account
   */
  @Public()
  @Post('create-checkout-session')
  @HttpCode(HttpStatus.OK)
  async createCheckoutSession(
    @Body() dto: CreateCheckoutSessionDto,
  ): Promise<{ sessionId: string; url: string }> {
    return this.stripeSubscriptionService.createCheckoutSession(
      dto.tierId,
      dto.interval,
      dto.successUrl,
      dto.cancelUrl,
      dto.email,
    );
  }

  /**
   * Get all subscription tiers with their Stripe product/price IDs
   * Requires authentication
   */
  @Get('products')
  async getSubscriptionProducts(): Promise<SubscriptionTierWithStripe[]> {
    return this.stripeSubscriptionService.getSubscriptionProductsWithPrices();
  }

  /**
   * Initialize all subscription products and prices in Stripe
   * This is idempotent and can be called multiple times
   * Requires authentication
   */
  @Post('products/initialize')
  @HttpCode(HttpStatus.OK)
  async initializeProducts(): Promise<SubscriptionTierWithStripe[]> {
    return this.stripeSubscriptionService.initializeSubscriptionProducts();
  }

  /**
   * Get the Stripe price ID for a specific tier and interval
   * Requires authentication
   */
  @Get('price/:tierId')
  async getPriceId(
    @Param('tierId') tierId: string,
    @Query('interval') interval: 'month' | 'year' = 'month',
  ): Promise<{ priceId: string }> {
    const priceId = await this.stripeSubscriptionService.getPriceId(
      tierId,
      interval,
    );
    return { priceId };
  }

  /**
   * Create a subscription for a workspace
   * Requires authentication
   */
  @Post('workspace/:workspaceId/subscribe')
  @Roles('OWNER', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async createSubscription(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateSubscriptionDto,
  ): Promise<SubscriptionResponse> {
    const subscription = await this.stripeSubscriptionService.createSubscription(
      workspaceId,
      dto.tierId,
      dto.interval,
      dto.email,
      dto.paymentMethodId,
    );

    const tier = this.stripeSubscriptionService.getSubscriptionTier(dto.tierId);

    // Extract client secret from the expanded latest_invoice.payment_intent
    let clientSecret: string | undefined;
    const latestInvoice = subscription.latest_invoice;
    if (
      latestInvoice &&
      typeof latestInvoice === 'object' &&
      'payment_intent' in latestInvoice
    ) {
      const paymentIntent = latestInvoice.payment_intent;
      if (paymentIntent && typeof paymentIntent === 'object' && 'client_secret' in paymentIntent) {
        clientSecret = paymentIntent.client_secret as string;
      }
    }

    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      clientSecret,
      tier: tier!,
      interval: dto.interval,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    };
  }

  /**
   * Get the current subscription for a workspace
   * Requires authentication
   */
  @Get('workspace/:workspaceId/subscription')
  async getWorkspaceSubscription(
    @Param('workspaceId') workspaceId: string,
  ): Promise<{ subscription: any; tier: SubscriptionTier | null }> {
    return this.stripeSubscriptionService.getWorkspaceSubscription(workspaceId);
  }

  /**
   * Cancel a workspace's subscription
   * Requires authentication
   */
  @Delete('workspace/:workspaceId/subscription')
  @Roles('OWNER', 'ADMIN')
  async cancelSubscription(
    @Param('workspaceId') workspaceId: string,
    @Query('immediate') immediate?: string,
  ): Promise<{ message: string; cancelAtPeriodEnd: boolean }> {
    const cancelAtPeriodEnd = immediate !== 'true';
    await this.stripeSubscriptionService.cancelSubscription(
      workspaceId,
      cancelAtPeriodEnd,
    );
    return {
      message: cancelAtPeriodEnd
        ? 'Subscription will be canceled at the end of the billing period'
        : 'Subscription has been canceled immediately',
      cancelAtPeriodEnd,
    };
  }

  /**
   * Create a Stripe Billing Portal session for a workspace
   * Allows users to manage their subscription, update payment methods, and view invoices
   * Requires authentication
   */
  @Post('workspace/:workspaceId/billing-portal')
  @Roles('OWNER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async createBillingPortalSession(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: BillingPortalDto,
  ): Promise<{ url: string }> {
    const session = await this.stripeSubscriptionService.createBillingPortalSession(
      workspaceId,
      dto.returnUrl,
    );
    return { url: session.url };
  }
}

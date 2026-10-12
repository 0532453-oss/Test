import { Module } from '@nestjs/common';

import { StripeConnectService } from './stripe-connect.service';
import { StripeSubscriptionService } from './stripe-subscription.service';
import { StripeService } from './stripe.service';

/**
 * Stripe Manager Module
 *
 * Handles all Stripe-related operations:
 * - Payment processing
 * - Stripe Connect for marketplace
 * - Subscription management
 * - Webhook handling
 */
@Module({
  providers: [
    StripeService,
    StripeConnectService,
    StripeSubscriptionService,
  ],
  exports: [
    StripeService,
    StripeConnectService,
    StripeSubscriptionService,
  ],
})
export class StripeManagerModule {}

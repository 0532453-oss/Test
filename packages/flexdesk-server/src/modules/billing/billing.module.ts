import { Module } from '@nestjs/common';

// Manager Modules

// Controllers
import { InvoiceController } from './controllers/invoice.controller';
import { StripeConnectController } from './controllers/stripe-connect.controller';
import { StripeSubscriptionController } from './controllers/stripe-subscription.controller';
import { StripeWebhookController } from './controllers/stripe-webhook.controller';
import { InvoiceManagerModule } from './invoice-manager';
import { StripeManagerModule } from './stripe-manager';

/**
 * Billing Module
 *
 * Handles all billing-related functionality:
 * - Invoice management (via InvoiceManager)
 * - Stripe integration (via StripeManager)
 *   - Payment processing
 *   - Stripe Connect
 *   - Subscriptions
 *   - Webhooks
 */
@Module({
  imports: [
    StripeManagerModule,
    InvoiceManagerModule,
  ],
  controllers: [
    InvoiceController,
    StripeConnectController,
    StripeSubscriptionController,
    StripeWebhookController,
  ],
  exports: [
    StripeManagerModule,
    InvoiceManagerModule,
  ],
})
export class BillingModule {}

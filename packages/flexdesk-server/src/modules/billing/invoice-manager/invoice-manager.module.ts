import { Module } from '@nestjs/common';

import { BillingService } from './billing.service';

/**
 * Invoice Manager Module
 *
 * Handles all invoice-related operations:
 * - Invoice generation
 * - Invoice status management
 * - Invoice PDF generation
 * - Payment tracking
 */
@Module({
  providers: [BillingService],
  exports: [BillingService],
})
export class InvoiceManagerModule {}

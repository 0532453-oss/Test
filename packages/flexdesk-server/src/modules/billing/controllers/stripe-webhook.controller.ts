import {
  Controller,
  Post,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  type RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { type Request } from 'express';

import { StripeService, type WebhookEventResult } from '../stripe-manager/stripe.service';

import { Public } from '@/modules/auth/decorators/public.decorator';

@ApiTags('webhooks')
@Controller('webhooks')
export class StripeWebhookController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('stripe')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  @ApiExcludeEndpoint()
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ): Promise<WebhookEventResult> {
    const rawBody = request.rawBody;
    if (!rawBody) {
      throw new Error('Raw body not available. Ensure raw body parsing is enabled.');
    }
    return this.stripeService.handleWebhook(rawBody, signature);
  }
}

import { type RawBodyRequest } from '@nestjs/common';
import { type Request } from 'express';
import { type StripeService, type WebhookEventResult } from '../stripe-manager/stripe.service';
export declare class StripeWebhookController {
    private readonly stripeService;
    constructor(stripeService: StripeService);
    handleWebhook(signature: string, request: RawBodyRequest<Request>): Promise<WebhookEventResult>;
}

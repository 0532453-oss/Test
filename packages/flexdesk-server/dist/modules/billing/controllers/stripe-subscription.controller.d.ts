import { type BillingPortalDto } from '../dto/billing-portal.dto';
import { type CreateCheckoutSessionDto } from '../dto/create-checkout-session.dto';
import { type CreateSubscriptionDto } from '../dto/create-subscription.dto';
import { type StripeSubscriptionService, type SubscriptionTier, type SubscriptionTierWithStripe } from '../stripe-manager/stripe-subscription.service';
interface SubscriptionResponse {
    subscriptionId: string;
    status: string;
    clientSecret?: string;
    tier: SubscriptionTier;
    interval: string;
    currentPeriodEnd: string;
}
export declare class StripeSubscriptionController {
    private readonly stripeSubscriptionService;
    constructor(stripeSubscriptionService: StripeSubscriptionService);
    getSubscriptionTiers(): Promise<SubscriptionTier[]>;
    getSubscriptionTier(tierId: string): Promise<SubscriptionTier>;
    createCheckoutSession(dto: CreateCheckoutSessionDto): Promise<{
        sessionId: string;
        url: string;
    }>;
    getSubscriptionProducts(): Promise<SubscriptionTierWithStripe[]>;
    initializeProducts(): Promise<SubscriptionTierWithStripe[]>;
    getPriceId(tierId: string, interval?: 'month' | 'year'): Promise<{
        priceId: string;
    }>;
    createSubscription(workspaceId: string, dto: CreateSubscriptionDto): Promise<SubscriptionResponse>;
    getWorkspaceSubscription(workspaceId: string): Promise<{
        subscription: any;
        tier: SubscriptionTier | null;
    }>;
    cancelSubscription(workspaceId: string, immediate?: string): Promise<{
        message: string;
        cancelAtPeriodEnd: boolean;
    }>;
    createBillingPortalSession(workspaceId: string, dto: BillingPortalDto): Promise<{
        url: string;
    }>;
}
export {};

import { type ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { type PrismaService } from '@/core/database/prisma.service';
export interface SubscriptionTier {
    id: string;
    name: string;
    description: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: string[];
    isCustomPricing?: boolean;
    requiresCheckout?: boolean;
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
export declare const SUBSCRIPTION_TIERS: SubscriptionTier[];
export declare class StripeSubscriptionService {
    private readonly configService;
    private readonly prisma;
    private readonly stripe;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService);
    private ensureStripeConfigured;
    getSubscriptionTiers(): SubscriptionTier[];
    getSubscriptionTier(tierId: string): SubscriptionTier | undefined;
    createOrGetProduct(tier: SubscriptionTier): Promise<Stripe.Product>;
    createOrGetPrices(tier: SubscriptionTier, productId: string): Promise<{
        monthlyPriceId: string;
        yearlyPriceId: string;
    }>;
    initializeSubscriptionProducts(): Promise<SubscriptionTierWithStripe[]>;
    getSubscriptionProductsWithPrices(): Promise<SubscriptionTierWithStripe[]>;
    getPriceId(tierId: string, interval: 'month' | 'year'): Promise<string>;
    createOrGetCustomer(workspaceId: string, email: string, name?: string): Promise<Stripe.Customer>;
    createSubscription(workspaceId: string, tierId: string, interval: 'month' | 'year', email: string, paymentMethodId?: string): Promise<Stripe.Subscription>;
    getWorkspaceSubscription(workspaceId: string): Promise<{
        subscription: Stripe.Subscription | null;
        tier: SubscriptionTier | null;
    }>;
    cancelSubscription(workspaceId: string, cancelAtPeriodEnd?: boolean): Promise<Stripe.Subscription>;
    handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void>;
    handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void>;
    createBillingPortalSession(workspaceId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session>;
    createCheckoutSession(tierId: string, interval: 'month' | 'year', successUrl: string, cancelUrl: string, email?: string): Promise<{
        sessionId: string;
        url: string;
    }>;
}

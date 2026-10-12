import { type ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { type PrismaService } from '@/core/database/prisma.service';
export interface OnboardingLinkResult {
    accountId: string;
    onboardingUrl: string;
}
export interface StripeAccountStatus {
    accountId: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    onboardingComplete: boolean;
}
export declare class StripeConnectService {
    private readonly configService;
    private readonly prisma;
    private readonly stripe;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService);
    private getWorkspaceIdOrThrow;
    private ensureStripeConfigured;
    createOnboardingLink(technicianId: string): Promise<OnboardingLinkResult>;
    getAccountStatus(technicianId: string): Promise<StripeAccountStatus>;
    handleAccountUpdated(account: Stripe.Account): Promise<void>;
}

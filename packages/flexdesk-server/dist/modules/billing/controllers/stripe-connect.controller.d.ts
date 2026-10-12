import { type StripeConnectService, type OnboardingLinkResult, type StripeAccountStatus } from '../stripe-manager/stripe-connect.service';
export declare class StripeConnectController {
    private readonly stripeConnectService;
    constructor(stripeConnectService: StripeConnectService);
    createOnboardingLink(technicianId: string): Promise<OnboardingLinkResult>;
    getAccountStatus(technicianId: string): Promise<StripeAccountStatus>;
}

export declare class CreateCheckoutSessionDto {
    tierId: string;
    interval: 'month' | 'year';
    email?: string;
    successUrl: string;
    cancelUrl: string;
}

export interface PaymentIntent {
    id: string;
    client_secret: string;
    amount: number;
    currency: string;
    status: string;
}
export declare const stripeApi: {
    createPaymentIntent(invoiceId: string): Promise<PaymentIntent>;
    confirmPayment(paymentIntentId: string): Promise<{
        success: boolean;
    }>;
    getPaymentStatus(paymentIntentId: string): Promise<{
        status: string;
    }>;
};

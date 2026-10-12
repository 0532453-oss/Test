export interface Payment {
    id: string;
    invoiceId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'succeeded' | 'failed' | 'refunded';
    stripePaymentIntentId?: string;
    createdAt: string;
    updatedAt: string;
}

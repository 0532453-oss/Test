import { apiClient } from '@/modules/api/client/apiClient';

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

export const stripeApi = {
  async createPaymentIntent(invoiceId: string): Promise<PaymentIntent> {
    const response = await apiClient.post<PaymentIntent>(`/api/invoices/${invoiceId}/pay`, {});
    return response.data;
  },
  async confirmPayment(paymentIntentId: string): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>(
      `/api/stripe/confirm-payment`,
      { paymentIntentId }
    );
    return response.data;
  },
  async getPaymentStatus(paymentIntentId: string): Promise<{ status: string }> {
    const response = await apiClient.get<{ status: string }>(
      `/api/stripe/payment-status/${paymentIntentId}`
    );
    return response.data;
  },
};

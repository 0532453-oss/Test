/**
 * Hook to process Stripe payment
 */

import { useState, useCallback } from 'react';
import { apiClient } from '@/modules/api/client/apiClient';
import { stripeApi } from '../api/stripeApi';

export interface UseStripePaymentOptions {
  invoiceId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useStripePayment(options: UseStripePaymentOptions) {
  const { invoiceId, onSuccess, onError } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const createPaymentIntent = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const intent = await stripeApi.createPaymentIntent(invoiceId);
      setPaymentIntentId(intent.id);
      return intent;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create payment intent');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [invoiceId, onError]);

  const confirmPayment = useCallback(
    async (paymentIntentId: string) => {
      setLoading(true);
      setError(null);

      try {
        const result = await stripeApi.confirmPayment(paymentIntentId);
        onSuccess?.();
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to confirm payment');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, onError]
  );

  const processPayment = useCallback(async () => {
    try {
      // Create payment intent
      const intent = await createPaymentIntent();

      // Confirm payment (in a real app, this would use Stripe.js)
      return await confirmPayment(intent.id);
    } catch (err) {
      // Error already handled
      throw err;
    }
  }, [createPaymentIntent, confirmPayment]);

  return {
    createPaymentIntent,
    confirmPayment,
    processPayment,
    paymentIntentId,
    loading,
    error,
  };
}

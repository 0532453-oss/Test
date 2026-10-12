import { useState, useCallback } from 'react';
import { apiClient } from '@/modules/api/client/apiClient';

export function useSendInvoice(invoiceId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendInvoice = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post(`/api/invoices/${invoiceId}/send`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send invoice');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  return { sendInvoice, loading, error };
}

/**
 * Hook to auto-generate invoice from completed job
 */

import { useCallback, useState } from 'react';
import { apiClient } from '@/modules/api/client/apiClient';
import type { Invoice } from '../types/Invoice';
import type { Job } from '@/app/jobs/types/Job';

export interface UseInvoiceGenerationOptions {
  autoSend?: boolean;
  dueDateDays?: number; // Days from now for due date
}

export function useInvoiceGeneration(options: UseInvoiceGenerationOptions = {}) {
  const { autoSend = false, dueDateDays = 30 } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateInvoiceFromJob = useCallback(
    async (job: Job): Promise<Invoice> => {
      setLoading(true);
      setError(null);

      try {
        // Calculate due date
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + dueDateDays);

        // Generate invoice from job
        const response = await apiClient.post<Invoice>(
          `/api/invoices/generate-from-job`,
          {
            jobId: job.id,
            dueDate: dueDate.toISOString(),
            autoSend,
          }
        );

        return response.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to generate invoice');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [autoSend, dueDateDays]
  );

  return {
    generateInvoiceFromJob,
    loading,
    error,
  };
}

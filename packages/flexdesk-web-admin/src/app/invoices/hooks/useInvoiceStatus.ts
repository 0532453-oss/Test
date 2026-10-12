/**
 * Hook to get invoice payment status
 */

import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import type { Invoice } from '../types/Invoice';

export function useInvoiceStatus(invoiceId: string) {
  const { record: invoice, loading, error } = useFindOneRecord<Invoice>({
    objectNameSingular: 'Invoice',
    objectRecordId: invoiceId,
  });

  return {
    status: invoice?.status,
    isPaid: invoice?.status === 'PAID',
    isOverdue: invoice?.status === 'OVERDUE',
    paidAt: invoice?.paidAt,
    loading,
    error,
  };
}

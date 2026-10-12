/**
 * Hook to create an invoice
 */

import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import type { Invoice } from '../types/Invoice';

export function useCreateInvoice() {
  return useCreateOneRecord<Invoice>({
    objectNameSingular: 'Invoice',
  });
}

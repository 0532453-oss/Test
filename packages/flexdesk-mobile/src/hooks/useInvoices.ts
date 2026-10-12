/**
 * React Query hooks for invoices.
 */

import { useQuery } from '@tanstack/react-query';
import { listInvoices } from '../api/invoices.api';
import type { Invoice } from '../api/types';

/** Fetch invoices with optional status filter. */
export function useInvoices(status?: string) {
  return useQuery<Invoice[]>({
    queryKey: ['invoices', status ?? 'all'],
    queryFn: () => listInvoices(status),
  });
}

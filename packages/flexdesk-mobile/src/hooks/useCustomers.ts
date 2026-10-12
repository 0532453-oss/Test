/**
 * React Query hooks for customers.
 */

import { useQuery } from '@tanstack/react-query';
import { listCustomers, getCustomerDetails } from '../api/customers.api';
import type { Customer, CustomerDetails } from '../api/types';

/** Fetch customers with optional search query. */
export function useCustomers(search?: string) {
  return useQuery<Customer[]>({
    queryKey: ['customers', search ?? ''],
    queryFn: () => listCustomers(search),
  });
}

/** Fetch a single customer with full details (recent jobs, properties, invoices). */
export function useCustomerDetails(id: string | undefined) {
  return useQuery<CustomerDetails>({
    queryKey: ['customers', 'details', id],
    queryFn: () => getCustomerDetails(id!),
    enabled: !!id,
  });
}

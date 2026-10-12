/**
 * Customers API functions.
 *
 * Endpoints for creating, listing, searching, and managing customers.
 */

import apiClient from './client';
import type {
  CreateCustomerRequest,
  Customer,
  CustomerDetails,
  UpdateCustomerRequest,
} from './types';

/** Create a new customer. */
export async function createCustomer(req: CreateCustomerRequest): Promise<Customer> {
  const { data } = await apiClient.post<Customer>('/customers', req);
  return data;
}

/** List customers with optional search query. */
export async function listCustomers(search?: string): Promise<Customer[]> {
  const { data } = await apiClient.get<Customer[]>('/customers', {
    params: search ? { search } : undefined,
  });
  return data;
}

/** Get a single customer by ID. */
export async function getCustomerById(id: string): Promise<Customer> {
  const { data } = await apiClient.get<Customer>(`/customers/${id}`);
  return data;
}

/** Get a customer with recent jobs, properties, and invoices. */
export async function getCustomerDetails(id: string): Promise<CustomerDetails> {
  const { data } = await apiClient.get<CustomerDetails>(`/customers/${id}/details`);
  return data;
}

/** Update a customer's fields. */
export async function updateCustomer(
  id: string,
  req: UpdateCustomerRequest,
): Promise<Customer> {
  const { data } = await apiClient.put<Customer>(`/customers/${id}`, req);
  return data;
}

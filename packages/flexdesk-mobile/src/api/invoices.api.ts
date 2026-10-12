/**
 * Invoices API functions.
 *
 * Endpoints for creating, listing, managing, sending, and paying invoices.
 */

import apiClient from './client';
import type {
  Invoice,
  MarkPaidRequest,
  PaymentLinkResponse,
  SendInvoiceRequest,
  UpdateInvoiceStatusRequest,
} from './types';

/** Create an invoice from a completed job. */
export async function createInvoiceFromJob(jobId: string): Promise<Invoice> {
  const { data } = await apiClient.post<Invoice>(`/invoices/from-job/${jobId}`);
  return data;
}

/** List invoices with optional status filter. */
export async function listInvoices(status?: string): Promise<Invoice[]> {
  const { data } = await apiClient.get<Invoice[]>('/invoices', {
    params: status ? { status } : undefined,
  });
  return data;
}

/** Get a single invoice by ID. */
export async function getInvoiceById(id: string): Promise<Invoice> {
  const { data } = await apiClient.get<Invoice>(`/invoices/${id}`);
  return data;
}

/** Get all invoices for a specific customer. */
export async function getInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
  const { data } = await apiClient.get<Invoice[]>(
    `/invoices/by-customer/${customerId}`,
  );
  return data;
}

/** Update an invoice's status. */
export async function updateInvoiceStatus(
  id: string,
  req: UpdateInvoiceStatusRequest,
): Promise<Invoice> {
  const { data } = await apiClient.patch<Invoice>(`/invoices/${id}/status`, req);
  return data;
}

/** Send an invoice to the customer (via email). */
export async function sendInvoice(
  id: string,
  req?: SendInvoiceRequest,
): Promise<Invoice> {
  const { data } = await apiClient.post<Invoice>(`/invoices/${id}/send`, req);
  return data;
}

/** Mark an invoice as paid. */
export async function markInvoicePaid(
  id: string,
  req?: MarkPaidRequest,
): Promise<Invoice> {
  const { data } = await apiClient.post<Invoice>(`/invoices/${id}/mark-paid`, req);
  return data;
}

/** Generate a Stripe payment link for an invoice. */
export async function getPaymentLink(id: string): Promise<PaymentLinkResponse> {
  const { data } = await apiClient.post<PaymentLinkResponse>(
    `/invoices/${id}/payment-link`,
  );
  return data;
}

import type { Invoice } from '../types/Invoice';

import { apiClient } from '@/modules/api/client/apiClient';

export const invoiceApi = {
  async getInvoice(id: string): Promise<Invoice> {
    const response = await apiClient.get<Invoice>(`/api/invoices/${id}`);
    return response.data;
  },
  async getInvoices(params?: { filter?: any; limit?: number }): Promise<{ data: Invoice[] }> {
    const queryParams = new URLSearchParams();
    if (params?.filter) queryParams.append('filter', JSON.stringify(params.filter));
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const response = await apiClient.get<{ data: Invoice[] }>(`/api/invoices?${queryParams}`);
    return response.data;
  },
  async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
    const response = await apiClient.post<Invoice>('/api/invoices', data);
    return response.data;
  },
  async generateFromJob(jobId: string, options?: { dueDateDays?: number }): Promise<Invoice> {
    const response = await apiClient.post<Invoice>(`/api/invoices/generate-from-job`, {
      jobId,
      ...options,
    });
    return response.data;
  },
  async sendInvoice(id: string): Promise<void> {
    await apiClient.post(`/api/invoices/${id}/send`);
  },
};

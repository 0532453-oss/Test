export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  jobId: string;
  customerId: string;
  status: InvoiceStatus;
  amount: number;
  tax: number;
  total: number;
  dueDate?: string | null;
  lineItems: InvoiceLineItem[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Invoice entity types - aligned with Prisma schema
 */

export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;

export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export const invoiceStatusColors: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: '#95a5a6',
  [InvoiceStatus.SENT]: '#3498db',
  [InvoiceStatus.PAID]: '#27ae60',
  [InvoiceStatus.OVERDUE]: '#e74c3c',
  [InvoiceStatus.CANCELLED]: '#7f8c8d',
};

export const invoiceStatusChoices = [
  { id: InvoiceStatus.DRAFT, name: 'Draft' },
  { id: InvoiceStatus.SENT, name: 'Sent' },
  { id: InvoiceStatus.PAID, name: 'Paid' },
  { id: InvoiceStatus.OVERDUE, name: 'Overdue' },
  { id: InvoiceStatus.CANCELLED, name: 'Cancelled' },
];

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  invoiceId: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  subtotal: number;
  taxRate?: number | null;
  taxAmount?: number | null;
  total: number;
  notes?: string | null;
  dueDate?: Date | string | null;
  paidAt?: Date | string | null;
  customerId: string;
  jobId?: string | null;
  workspaceId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
  lineItems?: InvoiceLineItem[];
}

export interface InvoiceCreateInput {
  invoiceNumber?: string;
  status?: InvoiceStatus;
  subtotal: number;
  taxRate?: number | null;
  taxAmount?: number | null;
  total: number;
  notes?: string | null;
  dueDate?: Date | string | null;
  customerId: string;
  jobId?: string | null;
  lineItems?: Omit<InvoiceLineItem, 'id' | 'invoiceId'>[];
}

export interface InvoiceUpdateInput extends Partial<InvoiceCreateInput> {
  id: string;
}

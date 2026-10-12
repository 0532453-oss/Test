import { type BaseObjectRecord } from '../../object-record/types/BaseObjectRecord';
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export interface InvoiceLineItem {
    id: string;
    invoiceId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}
export interface Invoice extends BaseObjectRecord {
    jobId: string;
    customerId: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    amount: number;
    tax: number;
    total: number;
    dueDate?: string | null;
    paidAt?: string | null;
    stripePaymentId?: string | null;
    lineItems?: InvoiceLineItem[];
}

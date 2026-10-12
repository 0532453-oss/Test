import type { Invoice } from '../types/Invoice';
export declare const invoiceApi: {
    getInvoice(id: string): Promise<Invoice>;
    getInvoices(params?: {
        filter?: any;
        limit?: number;
    }): Promise<{
        data: Invoice[];
    }>;
    createInvoice(data: Partial<Invoice>): Promise<Invoice>;
    generateFromJob(jobId: string, options?: {
        dueDateDays?: number;
    }): Promise<Invoice>;
    sendInvoice(id: string): Promise<void>;
};

import { useState } from 'react';
import { useCreateInvoice } from '../hooks/useCreateInvoice';
import type { InvoiceLineItem } from '../types/Invoice';

interface InvoiceFormProps {
  jobId: string;
  customerId: string;
  onSuccess?: () => void;
}

export function InvoiceForm({ jobId, customerId, onSuccess }: InvoiceFormProps) {
  const { createRecord: createInvoice, loading } = useCreateInvoice();
  const [lineItems, setLineItems] = useState<Omit<InvoiceLineItem, 'id' | 'invoiceId'>[]>([
    { description: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const total = lineItems.reduce((sum, item) => sum + item.total, 0);
      await createInvoice({
        jobId,
        customerId,
        status: 'DRAFT',
        amount: total,
        tax: total * 0.1,
        total: total * 1.1,
        lineItems: lineItems.map((item) => ({ ...item, id: '', invoiceId: '' })),
      });
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create invoice:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {lineItems.map((item, index) => (
        <div key={index} className="flex gap-2">
          <input
            type="text"
            placeholder="Description"
            value={item.description}
            onChange={(e) => {
              const newItems = [...lineItems];
              newItems[index].description = e.target.value;
              setLineItems(newItems);
            }}
            className="flex-1 px-3 py-2 border rounded"
          />
          <input
            type="number"
            placeholder="Qty"
            value={item.quantity}
            onChange={(e) => {
              const newItems = [...lineItems];
              newItems[index].quantity = Number(e.target.value);
              newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
              setLineItems(newItems);
            }}
            className="w-20 px-3 py-2 border rounded"
          />
          <input
            type="number"
            placeholder="Price"
            value={item.unitPrice}
            onChange={(e) => {
              const newItems = [...lineItems];
              newItems[index].unitPrice = Number(e.target.value);
              newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
              setLineItems(newItems);
            }}
            className="w-24 px-3 py-2 border rounded"
          />
          <span className="px-3 py-2">${item.total.toFixed(2)}</span>
        </div>
      ))}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {loading ? 'Creating...' : 'Create Invoice'}
      </button>
    </form>
  );
}

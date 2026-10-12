import type { Invoice } from '../types/Invoice';

interface InvoiceCardProps {
  invoice: Invoice;
  onClick?: () => void;
}

const statusColors: Record<Invoice['status'], string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

export function InvoiceCard({ invoice, onClick }: InvoiceCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md" onClick={onClick}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold">{invoice.invoiceNumber}</h3>
          <p className="text-sm text-gray-600">${invoice.total.toFixed(2)}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs ${statusColors[invoice.status]}`}>
          {invoice.status}
        </span>
      </div>
      {invoice.dueDate && (
        <p className="text-xs text-gray-500">
          Due: {new Date(invoice.dueDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

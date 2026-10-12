import { useParams } from 'react-router-dom';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useStripePayment } from '@/app/invoices/hooks/useStripePayment';
import { PaymentStatusBadge } from '@service-flex/components/PaymentStatusBadge';
import type { Invoice } from '@/modules/billing/types/Invoice';

export const InvoiceShowPage = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { record: invoice, loading } = useFindOneRecord<Invoice>({
    objectNameSingular: 'Invoice',
    objectRecordId: invoiceId || '',
  });
  const { processPayment, loading: paymentLoading } = useStripePayment({
    invoiceId: invoiceId || '',
  });

  if (loading) return <div>Loading...</div>;
  if (!invoice) return <div>Invoice not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
            <PaymentStatusBadge status={invoice.status} />
          </div>
          {invoice.status !== 'PAID' && (
            <button
              onClick={processPayment}
              disabled={paymentLoading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {paymentLoading ? 'Processing...' : 'Pay Now'}
            </button>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-gray-600">Amount: ${invoice.amount.toFixed(2)}</p>
            <p className="text-gray-600">Tax: ${invoice.tax.toFixed(2)}</p>
            <p className="text-xl font-bold">Total: ${invoice.total.toFixed(2)}</p>
          </div>
          {invoice.dueDate && (
            <p className="text-gray-600">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
          )}
        </div>
      </div>
    </div>
  );
};

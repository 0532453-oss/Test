/**
 * Customer Portal - Invoice Detail Page
 * Public page for customers to view a single invoice detail
 */

import { useParams, useSearchParams, useNavigate } from 'react-router';
import { useCustomerPortalInvoiceDetail } from './hooks/useCustomerPortal';

const formatCurrency = (amount: string) => {
  const numAmount = parseFloat(amount);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numAmount);
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const InvoiceStatusBadge = ({ status }: { status: string }) => {
  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    SENT: 'bg-blue-100 text-blue-800',
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-200 text-gray-600',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        statusColors[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {status}
    </span>
  );
};

export const PortalInvoiceDetailPage = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const { invoice, loading, error } = useCustomerPortalInvoiceDetail(
    token,
    invoiceId || null,
  );

  const handleBackToInvoices = () => {
    navigate(`/portal/invoices?token=${encodeURIComponent(token || '')}`);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">
            No access token provided. Please use the link sent to your email.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error?.message || 'Invoice not found'}</p>
          <button
            onClick={handleBackToInvoices}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const isOverdue =
    invoice.status !== 'PAID' &&
    invoice.status !== 'CANCELLED' &&
    invoice.dueDate &&
    new Date(invoice.dueDate) < new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customer Portal</h1>
              <p className="text-gray-600">Invoice Details</p>
            </div>
            <button
              onClick={handleBackToInvoices}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Back to Invoices
            </button>
          </div>
        </div>
      </header>

      {/* Invoice Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Invoice Header */}
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {invoice.invoiceNumber}
                </h2>
                {invoice.job && (
                  <p className="text-gray-600 mt-1">
                    Service: {invoice.job.title}
                  </p>
                )}
              </div>
              <InvoiceStatusBadge status={isOverdue ? 'OVERDUE' : invoice.status} />
            </div>
          </div>

          {/* Invoice Details */}
          <div className="px-6 py-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase">
                  Invoice Date
                </h3>
                <p className="mt-1 text-lg text-gray-900">
                  {formatDate(invoice.createdAt)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase">
                  Due Date
                </h3>
                <p
                  className={`mt-1 text-lg ${
                    isOverdue ? 'text-red-600 font-semibold' : 'text-gray-900'
                  }`}
                >
                  {formatDate(invoice.dueDate)}
                </p>
              </div>
              {invoice.paidAt && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase">
                    Paid On
                  </h3>
                  <p className="mt-1 text-lg text-green-600">
                    {formatDate(invoice.paidAt)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="px-6 py-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-500">
                    Description
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500">
                    Qty
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500">
                    Unit Price
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 text-gray-900">{item.description}</td>
                    <td className="py-3 text-right text-gray-600">
                      {item.quantity}
                    </td>
                    <td className="py-3 text-right text-gray-600">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-3 text-right text-gray-900 font-medium">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="px-6 py-6 bg-gray-50">
            <div className="flex flex-col items-end space-y-2">
              <div className="flex justify-between w-64">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(invoice.amount)}</span>
              </div>
              <div className="flex justify-between w-64">
                <span className="text-gray-600">Tax</span>
                <span className="text-gray-900">{formatCurrency(invoice.tax)}</span>
              </div>
              <div className="flex justify-between w-64 pt-2 border-t border-gray-300">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(invoice.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Notice */}
          {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
            <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
              <p className="text-sm text-blue-800">
                To make a payment, please contact us or use the payment link sent
                to your email.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

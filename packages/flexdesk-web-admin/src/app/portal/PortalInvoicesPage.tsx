/**
 * Customer Portal - Invoices Page
 * Public page for customers to view their invoices using a portal token
 */

import { useSearchParams, useNavigate } from 'react-router';
import { useCustomerPortalData, PortalInvoice } from './hooks/useCustomerPortal';

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
    month: 'short',
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
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusColors[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {status}
    </span>
  );
};

const InvoiceRow = ({
  invoice,
  onClick,
}: {
  invoice: PortalInvoice;
  onClick: () => void;
}) => {
  const isOverdue =
    invoice.status !== 'PAID' &&
    invoice.status !== 'CANCELLED' &&
    invoice.dueDate &&
    new Date(invoice.dueDate) < new Date();

  return (
    <tr
      onClick={onClick}
      className="hover:bg-accent/50 cursor-pointer transition-colors"
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-foreground">
          {invoice.invoiceNumber}
        </div>
        {invoice.job && (
          <div className="text-sm text-muted-foreground">{invoice.job.title}</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <InvoiceStatusBadge status={isOverdue ? 'OVERDUE' : invoice.status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
        {formatDate(invoice.createdAt)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
        {formatDate(invoice.dueDate)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
        {formatCurrency(invoice.total)}
      </td>
    </tr>
  );
};

export const PortalInvoicesPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const { customer, invoices, loading, error } = useCustomerPortalData(token);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">
            No access token provided. Please use the link sent to your email to
            access your customer portal.
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
          <p className="mt-4 text-gray-600">Loading your invoices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error.message}</p>
          <p className="text-sm text-gray-500 mt-4">
            Your access link may have expired. Please contact support for a new
            link.
          </p>
        </div>
      </div>
    );
  }

  const handleInvoiceClick = (invoiceId: string) => {
    navigate(`/portal/invoices/${invoiceId}?token=${encodeURIComponent(token)}`);
  };

  const handleViewJobs = () => {
    navigate(`/portal/jobs?token=${encodeURIComponent(token)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customer Portal</h1>
              {customer && (
                <p className="text-gray-600">Welcome, {customer.name}</p>
              )}
            </div>
            <nav className="flex space-x-4">
              <span className="px-3 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
                Invoices
              </span>
              <button
                onClick={handleViewJobs}
                className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Job History
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Invoices</h2>
            <p className="text-sm text-gray-500">
              {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {invoices.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">You don't have any invoices yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-accent">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-accent-foreground uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-accent-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-accent-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-accent-foreground uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-accent-foreground uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {invoices.map((invoice) => (
                    <InvoiceRow
                      key={invoice.id}
                      invoice={invoice}
                      onClick={() => handleInvoiceClick(invoice.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

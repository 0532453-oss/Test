import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Breadcrumb, BreadcrumbPage } from '@/components/admin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button as AtlantisButton, Text, Banner, Icon, FormatDateTime, useFormatCurrency, Spinner } from '../components/atlantis';

// API URL for payment verification
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  status: string;
  paidAt: string | null;
  stripePaymentId: string | null;
  customer?: {
    name: string;
    email: string;
  };
}

type PaymentStatus = 'loading' | 'success' | 'pending' | 'failed' | 'not_found';

export const PaymentSuccessPage = () => {
  const formatCurrency = useFormatCurrency();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const invoiceId = searchParams.get('invoiceId');
  const sessionId = searchParams.get('session_id');

  // Verify payment by fetching invoice status
  const verifyPayment = useCallback(async () => {
    if (!invoiceId) {
      setPaymentStatus('not_found');
      setError('No invoice ID provided');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/invoices/${invoiceId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setPaymentStatus('not_found');
          setError('Invoice not found');
          return;
        }
        throw new Error('Failed to verify payment');
      }

      const data: Invoice = await response.json();
      setInvoice(data);

      // Check payment status based on invoice status
      // The webhook (checkout.session.completed) updates the invoice to PAID
      if (data.status === 'PAID' && data.stripePaymentId) {
        setPaymentStatus('success');
      } else if (data.status === 'PAID') {
        // Paid but no Stripe payment ID yet (webhook may still be processing)
        setPaymentStatus('success');
      } else if (retryCount < 5) {
        // Payment might still be processing - webhook hasn't been received yet
        // Retry a few times with increasing delay
        setPaymentStatus('pending');
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
        }, 2000 * (retryCount + 1));
      } else {
        // After retries, show pending state
        setPaymentStatus('pending');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setPaymentStatus('failed');
    }
  }, [invoiceId, retryCount]);

  useEffect(() => {
    verifyPayment();
  }, [verifyPayment]);


  return (
    <>
      <Breadcrumb>
        <BreadcrumbPage>Payment Confirmation</BreadcrumbPage>
      </Breadcrumb>

      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-lg">
          {/* Loading State */}
          {paymentStatus === 'loading' && (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <Spinner size="large" />
                  <Text variation="subdued">Verifying your payment...</Text>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success State */}
          {paymentStatus === 'success' && invoice && (
            <Card>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-[--color-success--surface] flex items-center justify-center">
                    <Icon name="successCircle" size="large" className="text-[--color-success--text]" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-[--color-success--text]">
                  Payment Successful!
                </CardTitle>
                <CardDescription>
                  Thank you for your payment. Your transaction has been completed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Transaction Details */}
                <div className="bg-[--color-surface--hover] rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Text element="span" variation="subdued" size="small">Invoice Number</Text>
                    <Text element="span" className="font-medium">{invoice.invoiceNumber}</Text>
                  </div>
                  <div className="flex items-center justify-between">
                    <Text element="span" variation="subdued" size="small">Amount Paid</Text>
                    <Text element="span" size="large" className="font-semibold">{formatCurrency(invoice.total)}</Text>
                  </div>
                  {invoice.paidAt && (
                    <div className="flex items-center justify-between">
                      <Text element="span" variation="subdued" size="small">Payment Date</Text>
                      <Text element="span" size="small">
                        <FormatDateTime date={invoice.paidAt} showYear />
                      </Text>
                    </div>
                  )}
                  {invoice.stripePaymentId && (
                    <div className="flex items-center justify-between">
                      <Text element="span" variation="subdued" size="small">Transaction ID</Text>
                      <code className="text-xs bg-[--color-surface--hover] px-2 py-1 rounded">
                        {invoice.stripePaymentId.slice(0, 20)}...
                      </code>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <AtlantisButton
                    type="primary"
                    onClick={() => navigate(`/invoices/${invoice.id}/show`)}
                    icon="receipt"
                    fullWidth
                  >
                    View Invoice
                  </AtlantisButton>
                  <AtlantisButton
                    type="secondary"
                    variation="subtle"
                    onClick={() => navigate('/invoices')}
                    icon="file"
                    fullWidth
                  >
                    All Invoices
                  </AtlantisButton>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending State (webhook processing) */}
          {paymentStatus === 'pending' && invoice && (
            <Card>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-[--color-warning--surface] flex items-center justify-center">
                    <Spinner size="large" className="text-[--color-warning--text]" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-[--color-warning--text]">
                  Processing Payment
                </CardTitle>
                <CardDescription>
                  Your payment is being processed. This may take a few moments.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-[--color-surface--hover] rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Text element="span" variation="subdued" size="small">Invoice Number</Text>
                    <Text element="span" className="font-medium">{invoice.invoiceNumber}</Text>
                  </div>
                  <div className="flex items-center justify-between">
                    <Text element="span" variation="subdued" size="small">Amount</Text>
                    <Text element="span" size="large" className="font-semibold">{formatCurrency(invoice.total)}</Text>
                  </div>
                </div>

                <Banner type="notice">
                  If the page doesn't update automatically, please check your invoice
                  in a few minutes or contact support.
                </Banner>

                <AtlantisButton
                  type="secondary"
                  variation="subtle"
                  onClick={() => navigate(`/invoices/${invoice.id}/show`)}
                  icon="file"
                  fullWidth
                >
                  View Invoice
                </AtlantisButton>
              </CardContent>
            </Card>
          )}

          {/* Error/Not Found State */}
          {(paymentStatus === 'failed' || paymentStatus === 'not_found') && (
            <Card>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-[--color-critical--surface] flex items-center justify-center">
                    <Icon name="warning" size="large" className="text-[--color-critical--text]" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-[--color-critical--text]">
                  {paymentStatus === 'not_found' ? 'Invoice Not Found' : 'Verification Failed'}
                </CardTitle>
                <CardDescription>
                  {error || 'We could not verify your payment at this time.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Banner type="error">
                  If you believe this is an error and your payment was processed,
                  please contact support with your payment confirmation email.
                </Banner>

                <div className="flex flex-col gap-3">
                  <AtlantisButton
                    type="secondary"
                    variation="subtle"
                    onClick={() => navigate('/invoices')}
                    icon="longArrowLeft"
                    fullWidth
                  >
                    Back to Invoices
                  </AtlantisButton>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Session ID for reference (if provided) */}
          {sessionId && paymentStatus === 'success' && (
            <Text align="center" variation="subdued" size="small" className="mt-4">
              Session: {sessionId.slice(0, 20)}...
            </Text>
          )}
        </div>
      </div>
    </>
  );
};

export default PaymentSuccessPage;

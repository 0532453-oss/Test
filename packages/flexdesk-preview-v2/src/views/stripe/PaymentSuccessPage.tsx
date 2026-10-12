import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router'
import { Breadcrumb, BreadcrumbPage } from '@/components/admin'
import {
  Button,
  Text,
  Banner,
  Icon,
  FormatDateTime,
  useFormatCurrency,
  Spinner,
  Card,
  Heading,
} from '@/atlantis'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'

interface Invoice {
  id: string
  invoiceNumber: string
  total: number
  status: string
  paidAt: string | null
  stripePaymentId: string | null
  customer?: {
    name: string
    email: string
  }
}

type PaymentStatus = 'loading' | 'success' | 'pending' | 'failed' | 'not_found'

export const PaymentSuccessPage = () => {
  const formatCurrency = useFormatCurrency()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const invoiceId = searchParams.get('invoiceId')
  const sessionId = searchParams.get('session_id')

  const verifyPayment = useCallback(async () => {
    if (!invoiceId) {
      setPaymentStatus('not_found')
      setError('No invoice ID provided')
      return
    }

    try {
      const response = await fetch(`${API_URL}/invoices/${invoiceId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          setPaymentStatus('not_found')
          setError('Invoice not found')
          return
        }
        throw new Error('Failed to verify payment')
      }

      const data: Invoice = await response.json()
      setInvoice(data)

      if (data.status === 'PAID' && data.stripePaymentId) {
        setPaymentStatus('success')
      } else if (data.status === 'PAID') {
        setPaymentStatus('success')
      } else if (retryCount < 5) {
        setPaymentStatus('pending')
        setTimeout(() => {
          setRetryCount((prev) => prev + 1)
        }, 2000 * (retryCount + 1))
      } else {
        setPaymentStatus('pending')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setPaymentStatus('failed')
    }
  }, [invoiceId, retryCount])

  useEffect(() => {
    verifyPayment()
  }, [verifyPayment])

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
              <Card.Body>
                <div className="flex flex-col items-center justify-center space-y-4 py-12">
                  <Spinner size="large" />
                  <Text variation="subdued">Verifying your payment...</Text>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Success State */}
          {paymentStatus === 'success' && invoice && (
            <Card>
              <Card.Body>
                <div className="text-center pb-2">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-[var(--color-success--surface)] flex items-center justify-center">
                      <Icon name="checkmark" size="large" color="success" />
                    </div>
                  </div>
                  <Heading level={3}>Payment Successful!</Heading>
                  <Text variation="subdued">
                    Thank you for your payment. Your transaction has been completed.
                  </Text>
                </div>

                <div className="space-y-6 mt-4">
                  <div className="bg-[var(--color-surface--hover)] rounded-lg p-4 space-y-3">
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
                        <code className="text-xs bg-[var(--color-surface--hover)] px-2 py-1 rounded">
                          {invoice.stripePaymentId.slice(0, 20)}...
                        </code>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      type="primary"
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                      icon="receipt"
                      fullWidth
                    >
                      View Invoice
                    </Button>
                    <Button
                      type="secondary"
                      variation="subtle"
                      onClick={() => navigate('/invoices')}
                      icon="file"
                      fullWidth
                    >
                      All Invoices
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Pending State (webhook processing) */}
          {paymentStatus === 'pending' && invoice && (
            <Card>
              <Card.Body>
                <div className="text-center pb-2">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-[var(--color-warning--surface)] flex items-center justify-center">
                      <Spinner size="large" />
                    </div>
                  </div>
                  <Heading level={3}>Processing Payment</Heading>
                  <Text variation="subdued">
                    Your payment is being processed. This may take a few moments.
                  </Text>
                </div>

                <div className="space-y-6 mt-4">
                  <div className="bg-[var(--color-surface--hover)] rounded-lg p-4 space-y-3">
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

                  <Button
                    type="secondary"
                    variation="subtle"
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                    icon="file"
                    fullWidth
                  >
                    View Invoice
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Error/Not Found State */}
          {(paymentStatus === 'failed' || paymentStatus === 'not_found') && (
            <Card>
              <Card.Body>
                <div className="text-center pb-2">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-[var(--color-critical--surface)] flex items-center justify-center">
                      <Icon name="warning" size="large" color="critical" />
                    </div>
                  </div>
                  <Heading level={3}>
                    {paymentStatus === 'not_found' ? 'Invoice Not Found' : 'Verification Failed'}
                  </Heading>
                  <Text variation="subdued">
                    {error || 'We could not verify your payment at this time.'}
                  </Text>
                </div>

                <div className="space-y-4 mt-4">
                  <Banner type="error">
                    If you believe this is an error and your payment was processed,
                    please contact support with your payment confirmation email.
                  </Banner>

                  <div className="flex flex-col gap-3">
                    <Button
                      type="secondary"
                      variation="subtle"
                      onClick={() => navigate('/invoices')}
                      icon="longArrowLeft"
                      fullWidth
                    >
                      Back to Invoices
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Session ID for reference */}
          {sessionId && paymentStatus === 'success' && (
            <Text align="center" variation="subdued" size="small" className="mt-4">
              Session: {sessionId.slice(0, 20)}...
            </Text>
          )}
        </div>
      </div>
    </>
  )
}

export default PaymentSuccessPage

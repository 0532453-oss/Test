import { useState } from 'react'
import { useRecordContext, useCreate, useRefresh } from 'ra-core'
import { Show, ReferenceField } from '@/components/admin'
import {
  Button as AtlantisButton,
  Card as AtlantisCard,
  DescriptionList,
  StatusLabel,
  Heading,
  Text,
  Icon,
  FormatDate,
  FormatDateTime,
  FormatCurrency,
  Modal,
  InputNumber,
  DatePicker,
  toast,
} from '@/atlantis'
import { differenceInDays, addDays } from 'date-fns'
import { Link, useNavigate } from 'react-router'
import { requestStatusToSemantic, formatStatusLabel, type Request } from '@/types'
import { Highlights, type HighlightItem } from '@/components/Highlights'

// Modal for creating invoice from request
const CreateInvoiceModal = ({
  open,
  onClose,
  request,
}: {
  open: boolean
  onClose: () => void
  request: Request
}) => {
  const [amount, setAmount] = useState<number>(request.estimatedValue || 0)
  const [dueDate, setDueDate] = useState<Date>(addDays(new Date(), 30))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [create] = useCreate()
  const navigate = useNavigate()
  const refresh = useRefresh()

  const handleSubmit = async () => {
    if (!request.clientId) {
      toast.error('No client associated with this request')
      return
    }

    setIsSubmitting(true)
    try {
      // Format due date as YYYY-MM-DD
      const yyyy = dueDate.getFullYear().toString()
      const mm = (dueDate.getMonth() + 1).toString().padStart(2, '0')
      const dd = dueDate.getDate().toString().padStart(2, '0')
      const formattedDueDate = `${yyyy}-${mm}-${dd}`

      const result = await create(
        'invoices',
        {
          data: {
            customerId: request.clientId,
            status: 'DRAFT',
            dueDate: formattedDueDate,
            issuedDate: new Date().toISOString().split('T')[0],
            lineItems: [
              {
                id: `temp-${Date.now()}`,
                description: request.title || 'Service',
                quantity: 1,
                unitPrice: amount,
              },
            ],
            subtotal: amount,
            total: amount,
            notes: `Created from request: ${request.title || 'Untitled'}`,
          },
        },
        { returnPromise: true }
      )

      if (result?.data?.id) {
        toast.success('Invoice created successfully')
        refresh()
        onClose()
        navigate(`/invoices/${result.data.id}`)
      }
    } catch (error) {
      console.error('Failed to create invoice:', error)
      toast.error('Failed to create invoice')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onRequestClose={onClose}
      title="Create Invoice"
      primaryAction={{
        label: isSubmitting ? 'Creating...' : 'Create Invoice',
        onClick: handleSubmit,
        disabled: isSubmitting || amount <= 0,
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: onClose,
      }}
    >
      <div className="space-y-6">
        <div className="p-4 rounded-lg bg-[var(--color-surface--background)] border border-border/50">
          <Text variation="subdued" size="small" className="mb-1">
            Job
          </Text>
          <Text className="font-medium">{request.title || 'Untitled Request'}</Text>
        </div>

        <div className="p-4 rounded-lg bg-[var(--color-surface--background)] border border-border/50">
          <Text variation="subdued" size="small" className="mb-1">
            Client
          </Text>
          <ReferenceField source="clientId" reference="clients">
            <ClientNameDisplay />
          </ReferenceField>
        </div>

        <div>
          <Text element="span" size="small" variation="subdued" className="mb-2 block">
            Amount
          </Text>
          <InputNumber
            value={amount}
            onChange={(value) => setAmount(value ?? 0)}
            min={0}
            step={0.01}
            prefixText="$"
            placeholder="0.00"
          />
        </div>

        <div>
          <Text element="span" size="small" variation="subdued" className="mb-2 block">
            Due Date
          </Text>
          <DatePicker
            selected={dueDate}
            onChange={setDueDate}
            fullWidth
          />
        </div>
      </div>
    </Modal>
  )
}

const ClientNameDisplay = () => {
  const record = useRecordContext()
  if (!record) return <Text variation="subdued">No client</Text>
  return <Text className="font-medium">{record.name}</Text>
}

export const RequestShow = () => {
  return (
    <Show resource="requests">
      <RequestShowContent />
    </Show>
  )
}

const RequestShowContent = () => {
  const record = useRecordContext<Request>()
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)

  if (!record) return null

  // Calculate highlights data
  const daysSinceCreated = differenceInDays(new Date(), new Date(record.createdAt))

  const highlights: HighlightItem[] = [
    {
      label: 'Estimated Value',
      value: record.estimatedValue
        ? <FormatCurrency value={record.estimatedValue} minimumFractionDigits={0} maximumFractionDigits={0} />
        : 'Not estimated',
      icon: <Icon name="money" size="small" />,
      className: record.estimatedValue
        ? 'text-[var(--color-success--text)]'
        : 'text-[var(--color-text--secondary)]',
    },
    {
      label: 'Preferred Date',
      value: record.preferredDate
        ? <FormatDate date={record.preferredDate} showYear useRelative />
        : 'No preference',
      icon: <Icon name="calendar" size="small" />,
      className: record.preferredDate ? undefined : 'text-[var(--color-text--secondary)]',
    },
    {
      label: 'Days Open',
      value: daysSinceCreated.toString(),
      icon: <Icon name="timer" size="small" />,
      className: daysSinceCreated > 7 ? 'text-[var(--color-warning--text)]' : undefined,
    },
    {
      label: 'Status',
      value: record.status,
      icon: <Icon name="inbox" size="small" />,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <AtlantisCard>
        <AtlantisCard.Header className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--color-interactive--subtle)] flex items-center justify-center">
                <Icon name="inbox" size="large" color="interactive" />
              </div>
              <div>
                <Heading level={3}>{record.title}</Heading>
                <div className="flex items-center gap-2 mt-1">
                  <ReferenceField source="clientId" reference="clients" link="show">
                    <ClientName />
                  </ReferenceField>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusLabel
                label={formatStatusLabel(record.status)}
                status={requestStatusToSemantic[record.status]}
              />
              <Link to={`/requests/${record.id}/edit`}>
                <AtlantisButton type="secondary" variation="subtle" size="small" icon="edit">
                  Edit
                </AtlantisButton>
              </Link>
            </div>
          </div>
        </AtlantisCard.Header>
      </AtlantisCard>

      {/* Highlights Section */}
      <Highlights items={highlights} />

      {/* Action Cards */}
      {record.status !== 'CONVERTED' && record.status !== 'CLOSED' && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Convert to Job */}
          <AtlantisCard accent="blue" className="border-[var(--color-interactive)]/50 bg-[var(--color-interactive--subtle)]">
            <AtlantisCard.Body>
              <div className="flex flex-col gap-3">
                <div>
                  <Heading level={4}>Convert to Job</Heading>
                  <Text variation="subdued" size="small">
                    Schedule and assign work for this request.
                  </Text>
                </div>
                <Link to={`/jobs/create?clientId=${record.clientId}&requestId=${record.id}`}>
                  <AtlantisButton type="primary" variation="work" icon="longArrowRight">
                    Convert to Job
                  </AtlantisButton>
                </Link>
              </div>
            </AtlantisCard.Body>
          </AtlantisCard>

          {/* Create Invoice */}
          {record.clientId && (
            <AtlantisCard accent="green" className="border-[var(--color-success)]/50 bg-[var(--color-success--subtle)]">
              <AtlantisCard.Body>
                <div className="flex flex-col gap-3">
                  <div>
                    <Heading level={4}>Create Invoice</Heading>
                    <Text variation="subdued" size="small">
                      Bill the client directly for this request.
                    </Text>
                  </div>
                  <AtlantisButton
                    type="primary"
                    variation="learning"
                    icon="invoice"
                    onClick={() => setShowInvoiceModal(true)}
                  >
                    Create Invoice
                  </AtlantisButton>
                </div>
              </AtlantisCard.Body>
            </AtlantisCard>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Request Details */}
        <AtlantisCard>
          <AtlantisCard.Header className="p-4 pb-2">
            <div className="flex items-center gap-2">
              <Icon name="file" size="small" />
              <Heading level={4}>Request Details</Heading>
            </div>
          </AtlantisCard.Header>
          <AtlantisCard.Body>
            <DescriptionList
              data={[
                { label: 'Source', value: record.source || '—' },
                { label: 'Submitted', value: <FormatDateTime date={record.createdAt} showYear /> },
              ]}
            />
          </AtlantisCard.Body>
        </AtlantisCard>

        {/* Scheduling */}
        <AtlantisCard>
          <AtlantisCard.Header className="p-4 pb-2">
            <div className="flex items-center gap-2">
              <Icon name="calendar" size="small" />
              <Heading level={4}>Scheduling</Heading>
            </div>
          </AtlantisCard.Header>
          <AtlantisCard.Body>
            <DescriptionList
              data={[
                {
                  label: 'Preferred Date',
                  value: record.preferredDate
                    ? <FormatDate date={record.preferredDate} showYear useRelative />
                    : 'No preference',
                },
              ]}
            />
          </AtlantisCard.Body>
        </AtlantisCard>

        {/* Estimate */}
        <AtlantisCard>
          <AtlantisCard.Header className="p-4 pb-2">
            <div className="flex items-center gap-2">
              <Icon name="money" size="small" />
              <Heading level={4}>Estimate</Heading>
            </div>
          </AtlantisCard.Header>
          <AtlantisCard.Body>
            <DescriptionList
              data={[
                {
                  label: 'Estimated Value',
                  value: record.estimatedValue
                    ? <FormatCurrency value={record.estimatedValue} minimumFractionDigits={0} maximumFractionDigits={0} />
                    : 'Not estimated',
                },
              ]}
            />
          </AtlantisCard.Body>
        </AtlantisCard>

        {/* Client Info */}
        <AtlantisCard>
          <AtlantisCard.Header className="p-4 pb-2">
            <div className="flex items-center gap-2">
              <Icon name="person" size="small" />
              <Heading level={4}>Client</Heading>
            </div>
          </AtlantisCard.Header>
          <AtlantisCard.Body>
            <ReferenceField source="clientId" reference="clients" link="show">
              <ClientDetails />
            </ReferenceField>
          </AtlantisCard.Body>
        </AtlantisCard>

        {/* Description */}
        {record.description && (
          <AtlantisCard className="md:col-span-2">
            <AtlantisCard.Header className="p-4 pb-2">
              <Heading level={4}>Description</Heading>
            </AtlantisCard.Header>
            <AtlantisCard.Body>
              <Text size="small" className="whitespace-pre-wrap">{record.description}</Text>
            </AtlantisCard.Body>
          </AtlantisCard>
        )}
      </div>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        open={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        request={record}
      />
    </div>
  )
}

const ClientName = () => {
  const record = useRecordContext()
  if (!record) return null
  return <Text element="span" variation="subdued" size="small">{record.name}</Text>
}

const ClientDetails = () => {
  const record = useRecordContext()
  if (!record) return null

  return (
    <div className="space-y-1">
      <Text className="font-medium">{record.name}</Text>
      {record.email && <Text variation="subdued" size="small">{record.email}</Text>}
      {record.phone && <Text variation="subdued" size="small">{record.phone}</Text>}
    </div>
  )
}

import { useState } from 'react'
import { useRecordContext, useGetOne, useRefresh } from 'ra-core'
import { useNavigate } from 'react-router'
import { Show, ReferenceField } from '@/components/admin'
import {
  Card,
  Heading,
  Text,
  Icon,
  StatusLabel,
  DescriptionList,
  Table,
  Page,
  FormatDate,
  useFormatCurrency,
  Tabs,
  Tab,
  Button,
  toast,
} from '@/atlantis'
import { Separator } from '@/components/ui/separator'
import {
  estimateStatusToSemantic,
  formatStatusLabel,
  EstimateStatus,
  type Estimate,
} from '@/types'
import { Highlights, type HighlightItem } from '@/components/Highlights'
import { api } from '@/shared/hooks/useApi'

export const EstimateShow = () => {
  return (
    <Show resource="estimates">
      <EstimateShowContent />
    </Show>
  )
}

const EstimateShowContent = () => {
  const record = useRecordContext<Estimate>()
  const navigate = useNavigate()
  const refresh = useRefresh()
  const formatCurrency = useFormatCurrency()
  const [isSending, setIsSending] = useState(false)
  const [isConverting, setIsConverting] = useState(false)

  // Fetch related customer
  const { data: customer } = useGetOne(
    'clients',
    { id: record?.customerId || '' },
    { enabled: !!record?.customerId }
  )

  // Fetch converted job if exists
  const { data: convertedJob } = useGetOne(
    'jobs',
    { id: record?.convertedJobId || '' },
    { enabled: !!record?.convertedJobId }
  )

  if (!record) return null

  // Send estimate to customer
  const handleSend = async () => {
    setIsSending(true)
    try {
      await api.post(`/estimates/${record.id}/send`)
      toast.success('Estimate sent to customer')
      refresh()
    } catch {
      toast.error('Failed to send estimate')
    } finally {
      setIsSending(false)
    }
  }

  // Convert estimate to job
  const handleConvertToJob = async () => {
    setIsConverting(true)
    try {
      await api.post(`/estimates/${record.id}/convert-to-job`, {})
      toast.success('Estimate converted to job')
      refresh()
    } catch {
      toast.error('Failed to convert estimate to job')
    } finally {
      setIsConverting(false)
    }
  }

  // Build highlights
  const highlights: HighlightItem[] = [
    {
      label: 'Customer',
      value: customer?.name || 'Not assigned',
      icon: <Icon name="person" size="small" />,
      className: customer?.name ? undefined : 'text-[var(--color-text--secondary)]',
    },
    {
      label: 'Valid Until',
      value: record.validUntil ? (
        <FormatDate date={record.validUntil} showYear useRelative />
      ) : (
        'Not set'
      ),
      icon: <Icon name="calendar" size="small" />,
      className:
        record.status === EstimateStatus.EXPIRED
          ? 'text-[var(--color-critical--text)]'
          : undefined,
    },
    {
      label: 'Total',
      value: formatCurrency(record.total),
      icon: <Icon name="money" size="small" />,
      className: 'font-semibold',
    },
    {
      label: 'Line Items',
      value: `${record.lineItems?.length || 0} items`,
      icon: <Icon name="list" size="small" />,
    },
  ]

  // Determine primary action based on status
  const getPrimaryAction = () => {
    if (record.status === EstimateStatus.DRAFT) {
      return {
        label: isSending ? 'Sending...' : 'Send to Customer',
        icon: 'email' as const,
        onClick: handleSend,
        disabled: isSending,
      }
    }
    if (record.status === EstimateStatus.ACCEPTED) {
      return {
        label: isConverting ? 'Converting...' : 'Convert to Job',
        icon: 'work' as const,
        onClick: handleConvertToJob,
        disabled: isConverting,
      }
    }
    if (record.status === EstimateStatus.CONVERTED && record.convertedJobId) {
      return {
        label: 'View Job',
        icon: 'work' as const,
        url: `/jobs/${record.convertedJobId}`,
      }
    }
    return undefined
  }

  const getSecondaryAction = () => {
    if (record.status === EstimateStatus.DRAFT) {
      return {
        label: 'Edit',
        icon: 'edit' as const,
        url: `/estimates/${record.id}/edit`,
      }
    }
    return undefined
  }

  return (
    <Page
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--color-interactive--subtle)] flex items-center justify-center">
            <Icon name="invoice" size="base" />
          </div>
          <div>
            <Heading level={1}>Estimate {record.estimateNumber}</Heading>
            <ReferenceField source="customerId" reference="clients" link="show">
              <CustomerName />
            </ReferenceField>
          </div>
        </div>
      }
      titleMetaData={
        <StatusLabel
          label={formatStatusLabel(record.status)}
          status={estimateStatusToSemantic[record.status]}
        />
      }
      primaryAction={getPrimaryAction()}
      secondaryAction={getSecondaryAction()}
    >
      <div className="space-y-6">
        {/* Highlights Section */}
        <Highlights items={highlights} />

        {/* Tabbed Content */}
        <div className="mt-6">
          <Tabs defaultTab={0}>
            <Tab label="Line Items">
              <Card>
                <Card.Header>
                  <Heading level={4}>Line Items</Heading>
                </Card.Header>
                <Card.Body>
                  <Table>
                    <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell width="50%">
                          Description
                        </Table.HeaderCell>
                        <Table.HeaderCell align="right">Qty</Table.HeaderCell>
                        <Table.HeaderCell align="right">
                          Unit Price
                        </Table.HeaderCell>
                        <Table.HeaderCell align="right">Total</Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {record.lineItems?.map((item) => (
                        <Table.Row key={item.id}>
                          <Table.Cell>
                            <div>
                              <Text element="span" className="font-medium">
                                {item.description}
                              </Text>
                              {item.serviceType && (
                                <Text
                                  element="span"
                                  variation="subdued"
                                  size="small"
                                  className="ml-2"
                                >
                                  ({item.serviceType})
                                </Text>
                              )}
                            </div>
                          </Table.Cell>
                          <Table.Cell align="right">{item.quantity}</Table.Cell>
                          <Table.Cell align="right">
                            {formatCurrency(item.unitPrice)}
                          </Table.Cell>
                          <Table.Cell align="right">
                            {formatCurrency(item.total)}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                      {(!record.lineItems || record.lineItems.length === 0) && (
                        <Table.Row>
                          <Table.Cell
                            colSpan={4}
                            className="text-center text-[var(--color-text--secondary)]"
                          >
                            No line items
                          </Table.Cell>
                        </Table.Row>
                      )}
                    </Table.Body>
                  </Table>

                  {/* Totals Section */}
                  <div className="mt-4 border-t pt-4">
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <Text variation="subdued" size="small">
                            Subtotal
                          </Text>
                          <Text size="small">
                            {formatCurrency(record.subtotal)}
                          </Text>
                        </div>
                        {record.discount > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <Text variation="subdued" size="small">
                              Discount
                            </Text>
                            <Text size="small" variation="success">
                              -{formatCurrency(record.discount)}
                            </Text>
                          </div>
                        )}
                        {record.tax > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <Text variation="subdued" size="small">
                              Tax
                            </Text>
                            <Text size="small">
                              {formatCurrency(record.tax)}
                            </Text>
                          </div>
                        )}
                        <Separator />
                        <div className="flex items-center justify-between font-semibold">
                          <Text>Total</Text>
                          <Text size="large">{formatCurrency(record.total)}</Text>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Tab>

            <Tab label="Estimate Details">
              <Card>
                <Card.Header>
                  <div className="flex items-center gap-2">
                    <Icon name="invoice" size="small" />
                    <Heading level={4}>Estimate Details</Heading>
                  </div>
                </Card.Header>
                <Card.Body>
                  <DescriptionList
                    data={[
                      { label: 'Estimate #', value: record.estimateNumber },
                      { label: 'Title', value: record.title },
                      {
                        label: 'Status',
                        value: (
                          <StatusLabel
                            label={formatStatusLabel(record.status)}
                            status={estimateStatusToSemantic[record.status]}
                          />
                        ),
                      },
                      {
                        label: 'Created',
                        value: <FormatDate date={record.createdAt} showYear />,
                      },
                      {
                        label: 'Valid Until',
                        value: record.validUntil ? (
                          <FormatDate date={record.validUntil} showYear />
                        ) : (
                          '—'
                        ),
                      },
                      ...(record.description
                        ? [{ label: 'Description', value: record.description }]
                        : []),
                      ...(record.sentAt
                        ? [
                            {
                              label: 'Sent',
                              value: <FormatDate date={record.sentAt} showYear />,
                            },
                          ]
                        : []),
                      ...(record.viewedAt
                        ? [
                            {
                              label: 'Viewed',
                              value: (
                                <FormatDate date={record.viewedAt} showYear />
                              ),
                            },
                          ]
                        : []),
                      ...(record.respondedAt
                        ? [
                            {
                              label: 'Responded',
                              value: (
                                <FormatDate
                                  date={record.respondedAt}
                                  showYear
                                />
                              ),
                            },
                          ]
                        : []),
                      ...(record.convertedJobId && convertedJob
                        ? [
                            {
                              label: 'Converted Job',
                              value: (
                                <ReferenceField
                                  source="convertedJobId"
                                  reference="jobs"
                                  link="show"
                                >
                                  <JobLink />
                                </ReferenceField>
                              ),
                            },
                          ]
                        : []),
                    ]}
                  />
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </div>
      </div>
    </Page>
  )
}

const CustomerName = () => {
  const record = useRecordContext()
  if (!record) return null
  return (
    <Text variation="subdued" size="small">
      {record.name}
    </Text>
  )
}

const JobLink = () => {
  const record = useRecordContext()
  if (!record)
    return (
      <Text variation="subdued" size="small">
        -
      </Text>
    )
  return (
    <Text
      size="small"
      className="text-[var(--color-interactive)] hover:underline cursor-pointer"
    >
      {record.title}
    </Text>
  )
}

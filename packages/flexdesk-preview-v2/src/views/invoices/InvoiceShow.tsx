import { useRef } from 'react'
import { useRecordContext, useGetOne } from 'ra-core'
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
  Popover,
  Checkbox,
  Button,
  useBool,
  useLineItemColumnVisibility,
} from '@/atlantis'
import { Separator } from '@/components/ui/separator'
import {
  invoiceStatusToSemantic,
  formatStatusLabel,
  type Invoice,
} from '@/types'
import { Highlights, type HighlightItem } from '@/components/Highlights'

export const InvoiceShow = () => {
  return (
    <Show resource="invoices">
      <InvoiceShowContent />
    </Show>
  )
}

const InvoiceShowContent = () => {
  const record = useRecordContext<Invoice>()

  // Fetch related data for highlights
  const { data: client } = useGetOne(
    'clients',
    { id: record?.customerId || '' },
    { enabled: !!record?.customerId }
  )
  const { data: job } = useGetOne(
    'jobs',
    { id: record?.jobId || '' },
    { enabled: !!record?.jobId }
  )

  // Use Atlantis currency formatter with context settings
  const formatCurrency = useFormatCurrency()

  // Column visibility state with localStorage persistence
  const { showQty, showUnitPrice, setShowQty, setShowUnitPrice } =
    useLineItemColumnVisibility()

  // Popover state for column visibility toggle
  const columnsPopover = useBool(false)
  const columnsButtonRef = useRef<HTMLButtonElement>(null)

  // Calculate Description column width based on visible columns
  const getDescriptionWidth = () => {
    if (!showQty && !showUnitPrice) return '80%'
    if (!showQty || !showUnitPrice) return '65%'
    return '50%'
  }

  if (!record) return null

  // Build highlights data
  const highlights: HighlightItem[] = [
    {
      label: 'Client',
      value: client?.name || 'Not assigned',
      icon: <Icon name="person" size="small" />,
      className: client?.name ? undefined : 'text-[var(--color-text--secondary)]',
    },
    {
      label: 'Due Date',
      value: record.dueDate ? (
        <FormatDate date={record.dueDate} showYear useRelative />
      ) : (
        'Not set'
      ),
      icon: <Icon name="calendar" size="small" />,
      className:
        record.status === 'OVERDUE' ? 'text-[var(--color-critical--text)]' : undefined,
    },
    {
      label: 'Total',
      value: formatCurrency(record.total),
      icon: <Icon name="money" size="small" />,
      className: 'font-semibold',
    },
    {
      label: 'Related Job',
      value: job?.title || 'None',
      icon: <Icon name="work" size="small" />,
      className: job?.title ? undefined : 'text-[var(--color-text--secondary)]',
    },
  ]

  // Handle PDF generation - opens browser print dialog where user can save as PDF
  const handlePrintPdf = () => {
    window.print()
  }

  // Define action buttons based on status
  const getSecondaryAction = () => {
    return { label: 'Print / PDF', icon: 'print' as const, onClick: handlePrintPdf }
  }

  const getPrimaryAction = () => {
    return {
      label: 'Edit',
      icon: 'edit' as const,
      url: `/invoices/${record.id}/edit`,
    }
  }

  return (
    <Page
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--color-interactive--subtle)] flex items-center justify-center">
            <Icon name="invoice" size="base" />
          </div>
          <div>
            <Heading level={1}>Invoice {record.invoiceNumber}</Heading>
            <ReferenceField source="customerId" reference="clients" link="show">
              <ClientName />
            </ReferenceField>
          </div>
        </div>
      }
      titleMetaData={
        <StatusLabel
          label={formatStatusLabel(record.status)}
          status={invoiceStatusToSemantic[record.status]}
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
                  <div className="flex items-center justify-between w-full">
                    <Heading level={4}>Line Items</Heading>
                    <div className="relative">
                      <Button
                        ref={columnsButtonRef}
                        type="secondary"
                        size="small"
                        icon="sliders"
                        onClick={columnsPopover.toggle}
                        ariaLabel="Toggle column visibility"
                      >
                        Columns
                      </Button>
                      <Popover
                        open={columnsPopover.value}
                        onRequestClose={columnsPopover.setFalse}
                        attachTo={columnsButtonRef}
                        preferredPlacement="below-end"
                        width={200}
                      >
                        <Popover.Header>Column Visibility</Popover.Header>
                        <Popover.Content className="space-y-3">
                          <Checkbox
                            checked={showQty}
                            onChange={setShowQty}
                            label="Show Quantity"
                          />
                          <Checkbox
                            checked={showUnitPrice}
                            onChange={setShowUnitPrice}
                            label="Show Unit Price"
                          />
                        </Popover.Content>
                      </Popover>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Table>
                    <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell width={getDescriptionWidth()}>
                          Description
                        </Table.HeaderCell>
                        {showQty && (
                          <Table.HeaderCell align="right">Qty</Table.HeaderCell>
                        )}
                        {showUnitPrice && (
                          <Table.HeaderCell align="right">
                            Unit Price
                          </Table.HeaderCell>
                        )}
                        <Table.HeaderCell align="right">Total</Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {record.lineItems?.map((item) => (
                        <Table.Row key={item.id}>
                          <Table.Cell className="font-medium">
                            {item.description}
                          </Table.Cell>
                          {showQty && (
                            <Table.Cell align="right">{item.quantity}</Table.Cell>
                          )}
                          {showUnitPrice && (
                            <Table.Cell align="right">
                              {formatCurrency(item.unitPrice)}
                            </Table.Cell>
                          )}
                          <Table.Cell align="right">
                            {formatCurrency(item.total)}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                      {(!record.lineItems || record.lineItems.length === 0) && (
                        <Table.Row>
                          <Table.Cell
                            colSpan={2 + (showQty ? 1 : 0) + (showUnitPrice ? 1 : 0)}
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
                        {record.taxRate && record.taxRate > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <Text variation="subdued" size="small">
                              Tax ({(record.taxRate * 100).toFixed(2)}%)
                            </Text>
                            <Text size="small">
                              {formatCurrency(record.taxAmount || 0)}
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

            <Tab label="Invoice Details">
              <Card>
                <Card.Header>
                  <div className="flex items-center gap-2">
                    <Icon name="invoice" size="small" />
                    <Heading level={4}>Invoice Details</Heading>
                  </div>
                </Card.Header>
                <Card.Body>
                  <DescriptionList
                    data={[
                      { label: 'Invoice #', value: record.invoiceNumber },
                      {
                        label: 'Status',
                        value: (
                          <StatusLabel
                            label={formatStatusLabel(record.status)}
                            status={invoiceStatusToSemantic[record.status]}
                          />
                        ),
                      },
                      {
                        label: 'Created',
                        value: <FormatDate date={record.createdAt} showYear />,
                      },
                      {
                        label: 'Due Date',
                        value: (
                          <Text
                            element="span"
                            size="small"
                            variation={
                              record.status === 'OVERDUE' ? 'error' : 'default'
                            }
                          >
                            {record.dueDate ? (
                              <FormatDate date={record.dueDate} showYear />
                            ) : (
                              '—'
                            )}
                          </Text>
                        ),
                      },
                      ...(record.paidAt
                        ? [
                            {
                              label: 'Paid On',
                              value: (
                                <Text element="span" size="small" variation="success">
                                  <FormatDate date={record.paidAt} showYear />
                                </Text>
                              ),
                            },
                          ]
                        : []),
                      ...(record.notes
                        ? [{ label: 'Notes', value: record.notes }]
                        : []),
                      ...(record.jobId
                        ? [
                            {
                              label: 'Related Job',
                              value: (
                                <ReferenceField
                                  source="jobId"
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

const ClientName = () => {
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

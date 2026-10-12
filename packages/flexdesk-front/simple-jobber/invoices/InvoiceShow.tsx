import { useRecordContext, useGetOne } from 'ra-core';
import { Show, ReferenceField } from '@/components/admin';
import {
  Card as AtlantisCard,
  Heading,
  Text,
  Icon,
  StatusLabel,
  DescriptionList,
  Table,
  Page,
  FormatDate,
  FormatCurrency,
  useFormatCurrency,
  Tabs,
  Tab,
} from '../components/atlantis';
import { Separator } from '@/components/ui/separator';
import { invoiceStatusToSemantic, formatStatusLabel, type Invoice } from '../types';
import { Highlights, type HighlightItem } from '../components';

export const InvoiceShow = () => {
  return (
    <Show>
      <InvoiceShowContent />
    </Show>
  );
};

const InvoiceShowContent = () => {
  const record = useRecordContext<Invoice>();

  // Fetch related data for highlights
  const { data: client } = useGetOne('clients', { id: record?.customerId || '' }, { enabled: !!record?.customerId });
  const { data: job } = useGetOne('jobs', { id: record?.jobId || '' }, { enabled: !!record?.jobId });

  // Use Atlantis currency formatter with context settings
  const formatCurrency = useFormatCurrency();

  if (!record) return null;

  // Build highlights data
  const highlights: HighlightItem[] = [
    {
      label: 'Client',
      value: client?.name || 'Not assigned',
      icon: <Icon name="person" size="small" />,
      className: client?.name ? undefined : 'text-[--color-text--secondary]',
    },
    {
      label: 'Due Date',
      value: record.dueDate
        ? <FormatDate date={record.dueDate} showYear useRelative />
        : 'Not set',
      icon: <Icon name="calendar" size="small" />,
      className: record.status === 'OVERDUE' ? 'text-[--color-critical--text]' : undefined,
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
      className: job?.title ? undefined : 'text-[--color-text--secondary]',
    },
  ];

  // Define action buttons based on status
  const getSecondaryAction = () => {
    if (record.status === 'DRAFT') {
      return { label: 'Send', icon: 'send' as const, onClick: () => {} };
    }
    if (record.status === 'OVERDUE') {
      return { label: 'Send Reminder', icon: 'send' as const, onClick: () => {} };
    }
    return undefined;
  };

  const getPrimaryAction = () => {
    if (record.status === 'DRAFT') {
      return { label: 'Edit', icon: 'edit' as const, url: `/invoices/${record.id}` };
    }
    if (record.status === 'SENT' || record.status === 'OVERDUE') {
      return { label: 'Record Payment', icon: 'payment' as const, onClick: () => {} };
    }
    return undefined;
  };

  return (
    <Page
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[--color-interactive--subtle] flex items-center justify-center">
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
              <AtlantisCard>
                <AtlantisCard.Header>
                  <Heading level={4}>Line Items</Heading>
                </AtlantisCard.Header>
                <AtlantisCard.Body>
                  <Table>
                    <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell width="50%">Description</Table.HeaderCell>
                        <Table.HeaderCell align="right">Qty</Table.HeaderCell>
                        <Table.HeaderCell align="right">Unit Price</Table.HeaderCell>
                        <Table.HeaderCell align="right">Total</Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {record.lineItems?.map((item) => (
                        <Table.Row key={item.id}>
                          <Table.Cell className="font-medium">{item.description}</Table.Cell>
                          <Table.Cell align="right">{item.quantity}</Table.Cell>
                          <Table.Cell align="right">{formatCurrency(item.unitPrice)}</Table.Cell>
                          <Table.Cell align="right">{formatCurrency(item.total)}</Table.Cell>
                        </Table.Row>
                      ))}
                      {(!record.lineItems || record.lineItems.length === 0) && (
                        <Table.Row>
                          <Table.Cell colSpan={4} className="text-center text-[--color-text--secondary]">
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
                          <Text variation="subdued" size="small">Subtotal</Text>
                          <Text size="small">{formatCurrency(record.subtotal)}</Text>
                        </div>
                        {record.taxRate && record.taxRate > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <Text variation="subdued" size="small">
                              Tax ({(record.taxRate * 100).toFixed(2)}%)
                            </Text>
                            <Text size="small">{formatCurrency(record.taxAmount || 0)}</Text>
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
                </AtlantisCard.Body>
              </AtlantisCard>
            </Tab>

            <Tab label="Invoice Details">
              <AtlantisCard>
                <AtlantisCard.Header>
                  <div className="flex items-center gap-2">
                    <Icon name="invoice" size="small" />
                    <Heading level={4}>Invoice Details</Heading>
                  </div>
                </AtlantisCard.Header>
                <AtlantisCard.Body>
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
                            variation={record.status === 'OVERDUE' ? 'error' : 'default'}
                          >
                            {record.dueDate ? <FormatDate date={record.dueDate} showYear /> : '—'}
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
                                <ReferenceField source="jobId" reference="jobs" link="show">
                                  <JobLink />
                                </ReferenceField>
                              ),
                            },
                          ]
                        : []),
                    ]}
                  />
                </AtlantisCard.Body>
              </AtlantisCard>
            </Tab>
          </Tabs>
        </div>
    </div>
    </Page>
  );
};

const ClientName = () => {
  const record = useRecordContext();
  if (!record) return null;
  return <Text variation="subdued" size="small">{record.name}</Text>;
};

const JobLink = () => {
  const record = useRecordContext();
  if (!record) return <Text variation="subdued" size="small">-</Text>;
  return (
    <Text size="small" className="text-[--color-interactive] hover:underline cursor-pointer">
      {record.title}
    </Text>
  );
};

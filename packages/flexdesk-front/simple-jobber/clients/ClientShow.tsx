import { useRecordContext, useGetList } from 'ra-core';
import { Show, ReferenceManyField, DataTable } from '@/components/admin';
import { Link } from 'react-router';
import { useMemo } from 'react';
import {
  clientStatusToSemantic,
  jobStatusToSemantic,
  formatStatusLabel,
  type Client,
  type Job,
} from '../types';
import { Highlights, ClientLocationMap, type HighlightItem } from '../components';
import {
  Card as AtlantisCard,
  Icon,
  Heading,
  Text,
  StatusLabel,
  Button as AtlantisButton,
  DescriptionList,
  Tabs,
  Tab,
  Page,
  FormatRelativeDateTime,
  FormatEmail,
  Avatar,
} from '../components/atlantis';

export const ClientShow = () => {
  return (
    <Show>
      <ClientShowContent />
    </Show>
  );
};

const ClientShowContent = () => {
  const record = useRecordContext<Client>();

  // Fetch related data for highlights
  const { data: jobs } = useGetList('jobs', {
    pagination: { page: 1, perPage: 100 },
    filter: { clientId: record?.id },
  }, { enabled: !!record?.id });

  const { data: requests } = useGetList('requests', {
    pagination: { page: 1, perPage: 100 },
    filter: { clientId: record?.id },
  }, { enabled: !!record?.id });

  if (!record) return null;

  // Calculate highlights data
  const activeJobs = jobs?.filter((job) =>
    ['SCHEDULED', 'EN_ROUTE', 'IN_PROGRESS'].includes(job.status)
  ).length || 0;
  const totalRequests = requests?.length || 0;

  // Find last interaction date (most recent job or request)
  const lastInteractionDate = useMemo(() => {
    const allDates = [
      ...(jobs?.map((j) => new Date(j.updatedAt)) || []),
      ...(requests?.map((r) => new Date(r.updatedAt)) || []),
    ];
    return allDates.length > 0
      ? new Date(Math.max(...allDates.map((d) => d.getTime())))
      : null;
  }, [jobs, requests]);

  const highlights: HighlightItem[] = [
    {
      label: 'Active Jobs',
      value: activeJobs.toString(),
      icon: <Icon name="work" size="small" />,
      className: activeJobs > 0 ? 'text-[--color-success--text]' : undefined,
    },
    {
      label: 'Total Requests',
      value: totalRequests.toString(),
      icon: <Icon name="inbox" size="small" />,
    },
    {
      label: 'Last Activity',
      value: lastInteractionDate ? (
        <FormatRelativeDateTime date={lastInteractionDate} />
      ) : (
        'No activity'
      ),
      icon: <Icon name="calendar" size="small" />,
      className: lastInteractionDate ? undefined : 'text-[--color-text--secondary]',
    },
    {
      label: 'Status',
      value: record.status,
      icon: <Icon name="person" size="small" />,
    },
  ];

  // Custom title component with avatar, status, and edit button
  const pageTitle = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <Avatar
          initials={record.name?.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2) || '?'}
          name={record.name}
          size="large"
          color="var(--color-interactive--subtle)"
        />
        <div>
          <Heading level={1}>{record.name}</Heading>
          {record.email ? (
            <FormatEmail email={record.email} />
          ) : (
            <Text variation="subdued" size="small">No email</Text>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusLabel
          label={formatStatusLabel(record.status)}
          status={clientStatusToSemantic[record.status]}
        />
        <Link to={`/clients/${record.id}`}>
          <AtlantisButton type="secondary" variation="subtle" size="small" icon="edit">
            Edit
          </AtlantisButton>
        </Link>
      </div>
    </div>
  );

  return (
    <Page title={pageTitle}>
      {/* Highlights Section */}
      <Highlights items={highlights} />

      {/* Tabs */}
      <div className="mt-6">
        <Tabs defaultTab={0}>
          <Tab label="Overview">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Contact Information */}
              <AtlantisCard>
                <AtlantisCard.Header className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Icon name="person" size="small" />
                    <Heading level={4}>Contact Information</Heading>
                  </div>
                </AtlantisCard.Header>
                <AtlantisCard.Body>
                  <DescriptionList
                    data={[
                      { label: 'Email', value: record.email ? <FormatEmail email={record.email} /> : '—' },
                      { label: 'Phone', value: record.phone || '—' },
                    ]}
                  />
                </AtlantisCard.Body>
              </AtlantisCard>

              {/* Address */}
              <AtlantisCard>
                <AtlantisCard.Header className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Icon name="address" size="small" />
                    <Heading level={4}>Address</Heading>
                  </div>
                </AtlantisCard.Header>
                <AtlantisCard.Body>
                  {record.address ? (
                    <div className="space-y-4">
                      <div className="text-sm">
                        <Text>{record.address.street}</Text>
                        <Text>
                          {record.address.city}, {record.address.state} {record.address.zipCode}
                        </Text>
                        <Text>{record.address.country}</Text>
                      </div>
                      {/* Google Map */}
                      <ClientLocationMap
                        address={record.address}
                        clientName={record.name}
                      />
                    </div>
                  ) : (
                    <Text variation="subdued" size="small">No address on file</Text>
                  )}
                </AtlantisCard.Body>
              </AtlantisCard>

              {/* Notes */}
              <AtlantisCard className="md:col-span-2">
                <AtlantisCard.Header className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Icon name="note" size="small" />
                    <Heading level={4}>Notes</Heading>
                  </div>
                </AtlantisCard.Header>
                <AtlantisCard.Body>
                  <Text size="small">
                    {record.notes || 'No notes'}
                  </Text>
                </AtlantisCard.Body>
              </AtlantisCard>
            </div>
          </Tab>

          <Tab label="Jobs">
            <AtlantisCard>
              <AtlantisCard.Header className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Icon name="work" size="small" />
                  <Heading level={4}>Jobs</Heading>
                </div>
              </AtlantisCard.Header>
              <AtlantisCard.Body>
                <ReferenceManyField reference="jobs" target="clientId">
                  <DataTable>
                    <DataTable.Col source="title" label="Title" />
                    <DataTable.Col source="status" label="Status">
                      <JobStatusBadge />
                    </DataTable.Col>
                    <DataTable.DateCol source="scheduledStartAt" label="Scheduled" />
                  </DataTable>
                </ReferenceManyField>
              </AtlantisCard.Body>
            </AtlantisCard>
          </Tab>

          <Tab label="Requests">
            <AtlantisCard>
              <AtlantisCard.Header className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Icon name="inbox" size="small" />
                  <Heading level={4}>Requests</Heading>
                </div>
              </AtlantisCard.Header>
              <AtlantisCard.Body>
                <ReferenceManyField reference="requests" target="clientId">
                  <DataTable>
                    <DataTable.Col source="title" label="Title" />
                    <DataTable.Col source="status" label="Status" />
                    <DataTable.DateCol source="createdAt" label="Created" />
                  </DataTable>
                </ReferenceManyField>
              </AtlantisCard.Body>
            </AtlantisCard>
          </Tab>
        </Tabs>
      </div>
    </Page>
  );
};

const JobStatusBadge = () => {
  const record = useRecordContext<Job>();
  if (!record) return null;

  return (
    <StatusLabel
      label={formatStatusLabel(record.status)}
      status={jobStatusToSemantic[record.status]}
    />
  );
};

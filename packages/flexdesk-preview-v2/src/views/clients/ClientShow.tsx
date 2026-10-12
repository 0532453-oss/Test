import { useRecordContext, useGetList } from 'ra-core';
import { Show } from '@/components/admin';
import { Link } from 'react-router';
import { useMemo } from 'react';
import {
  clientStatusToSemantic,
  jobStatusToSemantic,
  formatStatusLabel,
  type Client,
  type Job,
  type Request,
} from '@/types';
import { Highlights, type HighlightItem } from '@/components/Highlights';
import { ClientLocationMap } from '@/components/ClientLocationMap';
import {
  Card,
  Icon,
  Heading,
  Text,
  StatusLabel,
  Button as AtlantisButton,
  DescriptionList,
  Tabs,
  Tab,
  FormatRelativeDateTime,
  FormatEmail,
  Avatar,
  DataTable,
  createColumnHelper,
  FormatDate,
} from '@/atlantis';

export const ClientShow = () => {
  return (
    <Show resource="clients" title={false} disableBreadcrumb>
      <ClientShowContent />
    </Show>
  );
};

const ClientShowContent = () => {
  const record = useRecordContext<Client>();

  // Fetch related data for highlights
  const { data: jobs } = useGetList<Job>('jobs', {
    pagination: { page: 1, perPage: 100 },
    filter: { clientId: record?.id },
  }, { enabled: !!record?.id });

  const { data: requests } = useGetList<Request>('requests', {
    pagination: { page: 1, perPage: 100 },
    filter: { clientId: record?.id },
  }, { enabled: !!record?.id });

  // Create column helpers for the tables
  const jobColumnHelper = createColumnHelper<Job>();
  const requestColumnHelper = createColumnHelper<Request>();

  const jobColumns = useMemo(() => [
    jobColumnHelper.accessor('title', {
      header: 'Title',
      cell: (info) => info.getValue(),
    }),
    jobColumnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => (
        <StatusLabel
          label={formatStatusLabel(info.getValue())}
          status={jobStatusToSemantic[info.getValue()]}
        />
      ),
    }),
    jobColumnHelper.accessor('scheduledDate', {
      header: 'Scheduled',
      cell: (info) => {
        const value = info.getValue();
        return value ? <FormatDate date={new Date(value)} /> : '—';
      },
    }),
  ], []);

  const requestColumns = useMemo(() => [
    requestColumnHelper.accessor('title', {
      header: 'Title',
      cell: (info) => info.getValue(),
    }),
    requestColumnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => formatStatusLabel(info.getValue()),
    }),
    requestColumnHelper.accessor('createdAt', {
      header: 'Created',
      cell: (info) => <FormatDate date={new Date(info.getValue())} />,
    }),
  ], []);

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

  if (!record) {
    return null;
  }

  const highlights: HighlightItem[] = [
    {
      label: 'Active Jobs',
      value: activeJobs.toString(),
      icon: <Icon name="work" size="small" />,
      className: activeJobs > 0 ? 'text-green-600' : undefined,
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
      className: lastInteractionDate ? undefined : 'text-gray-500',
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
            <Text variation="subdued" size="small">
              No email
            </Text>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusLabel
          label={formatStatusLabel(record.status)}
          status={clientStatusToSemantic[record.status]}
        />
        <Link to={`/clients/${record.id}/edit`}>
          <AtlantisButton
            type="secondary"
            variation="subtle"
            size="small"
            icon="edit"
          >
            Edit
          </AtlantisButton>
        </Link>
      </div>
    </div>
  );

  const pageHeader = (
    <Card className="border border-[--color-border--subtle] shadow-sm rounded-xl bg-[--color-surface--base]">
      <Card.Body className="flex items-center justify-between gap-4 p-4">
        {pageTitle}
      </Card.Body>
    </Card>
  );

  const decoratedHighlights: HighlightItem[] = highlights.map((item) => ({
    ...item,
    icon: (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[--color-interactive--subtle] text-[--color-interactive--strong]">
        {item.icon}
      </span>
    ),
    className: `rounded-xl border border-[--color-border--subtle] bg-[--color-surface--base] shadow-sm px-4 py-3 flex items-center gap-3 ${
      item.className ?? ''
    }`,
  }));

  return (
    <div className="min-h-full bg-[--color-surface--subtle] py-6">
      <div className="mx-auto flex max-w-5xl flex-col space-y-6 px-4">
        {/* Page Title */}
        {pageHeader}

        {/* Highlights Section */}
        <Highlights items={decoratedHighlights} />

        {/* Tabs */}
        <div className="mt-6">
          <Tabs defaultTab={0}>
            <Tab label="Overview">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Contact Information */}
                <Card className="border border-[--color-border--subtle] rounded-xl shadow-sm bg-[--color-surface--base]">
                  <Card.Header className="px-4 py-3 border-b border-[--color-border--subtle] bg-[--color-surface--raised] rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[--color-primary--subtle] text-[--color-primary--strong]">
                        <Icon name="person" size="small" />
                      </span>
                      <Heading level={4}>Contact Information</Heading>
                    </div>
                  </Card.Header>
                  <Card.Body className="px-4 py-4 space-y-3 rounded-b-xl">
                    <DescriptionList
                      data={[
                        {
                          label: 'Email',
                          value: record.email ? (
                            <FormatEmail email={record.email} />
                          ) : (
                            '—'
                          ),
                        },
                        { label: 'Phone', value: record.phone || '—' },
                      ]}
                    />
                  </Card.Body>
                </Card>

                {/* Address */}
                <Card className="border border-[--color-border--subtle] rounded-xl shadow-sm bg-[--color-surface--base]">
                  <Card.Header className="px-4 py-3 border-b border-[--color-border--subtle] bg-[--color-surface--raised] rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[--color-info--subtle] text-[--color-info--strong]">
                        <Icon name="address" size="small" />
                      </span>
                      <Heading level={4}>Address</Heading>
                    </div>
                  </Card.Header>
                  <Card.Body className="px-4 py-4 space-y-4 rounded-b-xl">
                    {record.address ? (
                      <div className="space-y-4">
                        <div className="text-sm space-y-1">
                          <Text>{record.address.street}</Text>
                          <Text>
                            {record.address.city}, {record.address.state}{' '}
                            {record.address.zipCode}
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
                      <Text variation="subdued" size="small">
                        No address on file
                      </Text>
                    )}
                  </Card.Body>
                </Card>

                {/* Notes */}
                <Card className="md:col-span-2 border border-[--color-border--subtle] rounded-xl shadow-sm bg-[--color-surface--base]">
                  <Card.Header className="px-4 py-3 border-b border-[--color-border--subtle] bg-[--color-surface--raised] rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[--color-accent--subtle] text-[--color-accent--strong]">
                        <Icon name="note" size="small" />
                      </span>
                      <Heading level={4}>Notes</Heading>
                    </div>
                  </Card.Header>
                  <Card.Body className="px-4 py-4 rounded-b-xl">
                    <Text size="small">
                      {record.notes || 'No notes'}
                    </Text>
                  </Card.Body>
                </Card>
              </div>
            </Tab>

            <Tab label="Jobs">
              <Card className="border border-[--color-border--subtle] rounded-xl shadow-sm bg-[--color-surface--base]">
                <Card.Header className="px-4 py-3 border-b border-[--color-border--subtle] bg-[--color-surface--raised] rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[--color-success--subtle] text-[--color-success--strong]">
                      <Icon name="work" size="small" />
                    </span>
                    <Heading level={4}>Jobs</Heading>
                  </div>
                </Card.Header>
                <Card.Body className="px-4 py-4 rounded-b-xl">
                  {jobs && jobs.length > 0 ? (
                    <DataTable data={jobs} columns={jobColumns as any} />
                  ) : (
                    <Text variation="subdued" size="small">
                      No jobs found
                    </Text>
                  )}
                </Card.Body>
              </Card>
            </Tab>

            <Tab label="Requests">
              <Card className="border border-[--color-border--subtle] rounded-xl shadow-sm bg-[--color-surface--base]">
                <Card.Header className="px-4 py-3 border-b border-[--color-border--subtle] bg-[--color-surface--raised] rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[--color-warning--subtle] text-[--color-warning--strong]">
                      <Icon name="inbox" size="small" />
                    </span>
                    <Heading level={4}>Requests</Heading>
                  </div>
                </Card.Header>
                <Card.Body className="px-4 py-4 rounded-b-xl">
                  {requests && requests.length > 0 ? (
                    <DataTable
                      data={requests}
                      columns={requestColumns as any}
                    />
                  ) : (
                    <Text variation="subdued" size="small">
                      No requests found
                    </Text>
                  )}
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

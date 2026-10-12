import { useMemo } from 'react';
import { useGetList, Translate } from 'ra-core';
import { Breadcrumb, BreadcrumbPage } from '@/components/admin';
import {
  Card as AtlantisCard,
  Container,
  Heading,
  Text,
  Icon,
  DataList,
  StatusLabel,
  StatusIndicator,
  Page,
  Grid,
  Glimmer,
  FormatDate,
  FormatTime,
} from '../components/atlantis';
import { Button as AtlantisButton } from '../components/atlantis/Button';
import {
  jobStatusToSemantic,
  jobPriorityToSemantic,
  requestStatusToSemantic,
  formatStatusLabel,
} from '../types';
import { Link } from 'react-router';
import { isToday } from 'date-fns';
import type { Request, Job, Client } from '../types';
import type { Address } from '../types';
import { useJobQuickActions } from '../jobs/JobQuickActionsSheet';
import { ClientLocationMap } from '../components/ClientLocationMap';

/** KPI Card skeleton for loading state */
const KpiCardSkeleton = () => (
  <AtlantisCard>
    <AtlantisCard.Header>
      <div className="flex flex-row items-center justify-between px-4 py-3">
        <Glimmer shape="rectangle" width={80} height={16} />
        <Glimmer shape="circle" size="small" />
      </div>
    </AtlantisCard.Header>
    <AtlantisCard.Body>
      <Glimmer shape="rectangle" width={60} height={32} className="mb-2" />
      <Glimmer shape="rectangle" width={100} height={12} />
    </AtlantisCard.Body>
  </AtlantisCard>
);

/** List item skeleton for loading state */
const ListItemSkeleton = () => (
  <div className="flex items-center justify-between p-3 rounded-lg border">
    <div className="flex-1 min-w-0 space-y-2">
      <Glimmer shape="rectangle" width="75%" height={16} />
      <Glimmer shape="rectangle" width="33%" height={12} />
    </div>
    <Glimmer shape="rectangle" width={80} height={24} className="rounded-full" />
  </div>
);

/** List card skeleton for loading state */
const ListCardSkeleton = () => (
  <AtlantisCard>
    <AtlantisCard.Header>
      <div className="flex flex-row items-center justify-between px-4 py-3">
        <Glimmer shape="rectangle" width={128} height={20} />
        <Glimmer shape="rectangle" width={112} height={32} />
      </div>
    </AtlantisCard.Header>
    <AtlantisCard.Body>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    </AtlantisCard.Body>
  </AtlantisCard>
);

/** Dashboard loading skeleton using Glimmer */
const DashboardLoadingSkeleton = () => (
  <Page
    title={<Glimmer shape="rectangle" width={200} height={32} />}
    subtitle=""
    className="pb-8"
  >
    {/* Welcome Section Skeleton */}
    <div className="mb-6 space-y-2">
      <Glimmer shape="rectangle" width={320} height={16} />
    </div>

    {/* KPI Cards Section */}
    <Container variant="flat" padding="none" className="mb-6">
      <Grid gap="base">
        <Grid.Cell size={{ xs: 12, md: 6, lg: 3 }}>
          <KpiCardSkeleton />
        </Grid.Cell>
        <Grid.Cell size={{ xs: 12, md: 6, lg: 3 }}>
          <KpiCardSkeleton />
        </Grid.Cell>
        <Grid.Cell size={{ xs: 12, md: 6, lg: 3 }}>
          <KpiCardSkeleton />
        </Grid.Cell>
        <Grid.Cell size={{ xs: 12, md: 6, lg: 3 }}>
          <KpiCardSkeleton />
        </Grid.Cell>
      </Grid>
    </Container>

    {/* Content Cards Section */}
    <Grid gap="large">
      <Grid.Cell size={{ xs: 12, md: 6 }}>
        <Container variant="elevated" padding="none">
          <ListCardSkeleton />
        </Container>
      </Grid.Cell>
      <Grid.Cell size={{ xs: 12, md: 6 }}>
        <Container variant="elevated" padding="none">
          <ListCardSkeleton />
        </Container>
      </Grid.Cell>
    </Grid>
  </Page>
);

export const DashboardPage = () => {
  const today = useMemo(() => new Date(), []);
  const jobQuickActions = useJobQuickActions({});

  // Fetch data
  const { data: requests, isLoading: requestsLoading } = useGetList<Request>('requests', {
    filter: { status: 'NEW' },
    sort: { field: 'createdAt', order: 'DESC' },
    pagination: { page: 1, perPage: 10 },
  });

  const { data: allJobs, isLoading: jobsLoading } = useGetList<Job>('jobs', {
    sort: { field: 'scheduledStartAt', order: 'ASC' },
    pagination: { page: 1, perPage: 100 },
  });

  const { data: clients, isLoading: clientsLoading } = useGetList<Client>('clients', {
    pagination: { page: 1, perPage: 100 },
  });

  const isLoading = requestsLoading || jobsLoading || clientsLoading;


  // Compute stats
  const stats = useMemo(() => {
    if (!allJobs) return null;

    const todaysJobs = allJobs.filter(
      (job) =>
        job.scheduledStartAt &&
        isToday(new Date(job.scheduledStartAt)) &&
        job.status !== 'CANCELLED'
    );

    const unscheduledJobs = allJobs.filter((job) => job.status === 'UNSCHEDULED');
    const inProgressJobs = allJobs.filter((job) => job.status === 'IN_PROGRESS');
    const scheduledJobs = allJobs.filter(
      (job) => job.status === 'SCHEDULED' && job.scheduledStartAt
    );

    const upcomingJobs = allJobs
      .filter(
        (job) =>
          job.scheduledStartAt &&
          new Date(job.scheduledStartAt) >= new Date() &&
          (job.status === 'SCHEDULED' || job.status === 'EN_ROUTE' || job.status === 'IN_PROGRESS')
      )
      .slice(0, 5);

    return {
      todaysJobs,
      unscheduledJobs,
      inProgressJobs,
      scheduledJobs,
      upcomingJobs,
    };
  }, [allJobs]);

  const newRequests = requests || [];
  const activeClients = clients?.filter((c) => c.status === 'ACTIVE').length || 0;

  if (isLoading) {
    return (
      <>
        <Breadcrumb>
          <BreadcrumbPage>
            <Translate i18nKey="ra.page.dashboard">Home</Translate>
          </BreadcrumbPage>
        </Breadcrumb>
        <DashboardLoadingSkeleton />
      </>
    );
  }

  return (
    <>
      <Breadcrumb>
        <BreadcrumbPage>
          <Translate i18nKey="ra.page.dashboard">Home</Translate>
        </BreadcrumbPage>
      </Breadcrumb>

      <Page
        title="Welcome back!"
        subtitle="Here's what's happening with your business today."
        className="pb-8"
      >
        {/* KPI Cards Section - Wrapped in flat Container for consistent section grouping */}
        <Container variant="flat" padding="none" className="mb-6">
          <Grid gap="base">
            {/* New Requests - Links to requests page */}
            <Grid.Cell size={{ xs: 12, md: 6, lg: 3 }}>
              <Link to="/requests?filter=%7B%22status%22%3A%22NEW%22%7D">
                <AtlantisCard accent="blue" elevation="base" className="h-full transition-all hover:shadow-lg">
                  <AtlantisCard.Header>
                    <div className="flex flex-row items-center justify-between px-4 py-3">
                      <Text variation="subdued" size="small">New Requests</Text>
                      <Icon name="inbox" color="blue" size="small" />
                    </div>
                  </AtlantisCard.Header>
                  <AtlantisCard.Body>
                    <Heading level={2}>{newRequests.length}</Heading>
                    <Text variation="subdued" size="small">Awaiting response</Text>
                  </AtlantisCard.Body>
                </AtlantisCard>
              </Link>
            </Grid.Cell>

            {/* Today's Jobs - Links to schedule page */}
            <Grid.Cell size={{ xs: 12, md: 6, lg: 3 }}>
              <Link to="/schedule">
                <AtlantisCard accent="green" elevation="base" className="h-full transition-all hover:shadow-lg">
                  <AtlantisCard.Header>
                    <div className="flex flex-row items-center justify-between px-4 py-3">
                      <Text variation="subdued" size="small">Today's Jobs</Text>
                      <Icon name="calendar" color="green" size="small" />
                    </div>
                  </AtlantisCard.Header>
                  <AtlantisCard.Body>
                    <Heading level={2}>{stats?.todaysJobs.length || 0}</Heading>
                    <Text variation="subdued" size="small">Scheduled for today</Text>
                  </AtlantisCard.Body>
                </AtlantisCard>
              </Link>
            </Grid.Cell>

            {/* Unscheduled Jobs - Links to jobs page with filter */}
            <Grid.Cell size={{ xs: 12, md: 6, lg: 3 }}>
              <Link to="/jobs?filter=%7B%22status%22%3A%22UNSCHEDULED%22%7D">
                <AtlantisCard accent="orange" elevation="base" className="h-full transition-all hover:shadow-lg">
                  <AtlantisCard.Header>
                    <div className="flex flex-row items-center justify-between px-4 py-3">
                      <Text variation="subdued" size="small">Unscheduled</Text>
                      <Icon name="timer" color="orange" size="small" />
                    </div>
                  </AtlantisCard.Header>
                  <AtlantisCard.Body>
                    <Heading level={2}>{stats?.unscheduledJobs.length || 0}</Heading>
                    <Text variation="subdued" size="small">Jobs to schedule</Text>
                  </AtlantisCard.Body>
                </AtlantisCard>
              </Link>
            </Grid.Cell>

            {/* Active Clients - Links to clients page */}
            <Grid.Cell size={{ xs: 12, md: 6, lg: 3 }}>
              <Link to="/clients?filter=%7B%22status%22%3A%22ACTIVE%22%7D">
                <AtlantisCard accent="purple" elevation="base" className="h-full transition-all hover:shadow-lg">
                  <AtlantisCard.Header>
                    <div className="flex flex-row items-center justify-between px-4 py-3">
                      <Text variation="subdued" size="small">Active Clients</Text>
                      <Icon name="clients" color="greyBlue" size="small" />
                    </div>
                  </AtlantisCard.Header>
                  <AtlantisCard.Body>
                    <Heading level={2}>{activeClients}</Heading>
                    <Text variation="subdued" size="small">Total active</Text>
                  </AtlantisCard.Body>
                </AtlantisCard>
              </Link>
            </Grid.Cell>
          </Grid>
        </Container>

        {/* Main Content Section - Stacked vertically */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <Container variant="elevated" padding="none">
            <AtlantisCard>
              <AtlantisCard.Header>
                <div className="flex flex-row items-center justify-between px-4 py-3">
                  <Heading level={4}>Today's schedule</Heading>
                  <Link to="/schedule">
                    <AtlantisButton type="tertiary" variation="subtle" size="small" icon="arrowRight" iconOnRight>
                      View Schedule
                    </AtlantisButton>
                  </Link>
                </div>
              </AtlantisCard.Header>
              <AtlantisCard.Body>
                <DataList data={stats?.todaysJobs?.slice(0, 5).map((job) => ({ ...job, id: job.id })) || []}>
                  <DataList.Layout gap="small">
                    {(job: Job) => (
                      <div className="flex items-center justify-between">
                        <Link to={`/jobs/${job.id}/show`} className="block flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <StatusIndicator
                                  status={jobStatusToSemantic[job.status]}
                                />
                                <Text maxLines="single" className="font-medium">{job.title}</Text>
                              </div>
                              <Text variation="subdued" size="small" className="ml-3.5">
                                {job.scheduledStartAt && <FormatTime time={job.scheduledStartAt} />}
                              </Text>
                            </div>
                            <StatusLabel
                              label={formatStatusLabel(job.status)}
                              status={jobStatusToSemantic[job.status]}
                            />
                          </div>
                        </Link>
                        <AtlantisButton
                          type="tertiary"
                          variation="subtle"
                          size="small"
                          icon="more"
                          ariaLabel={`Actions for ${job.title}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            jobQuickActions.open(job);
                          }}
                        />
                      </div>
                    )}
                  </DataList.Layout>
                  <DataList.EmptyState>
                    <div className="text-center py-8">
                      <Icon name="calendar" size="large" color="greyBlue" />
                      <Text variation="subdued" className="mt-2">No jobs scheduled for today</Text>
                    </div>
                  </DataList.EmptyState>
                </DataList>
              </AtlantisCard.Body>
            </AtlantisCard>
          </Container>

          {/* New Requests - Now below Today's Schedule */}
          <Container variant="elevated" padding="none">
            <AtlantisCard>
              <AtlantisCard.Header>
                <div className="flex flex-row items-center justify-between px-4 py-3">
                  <Heading level={4}>New requests</Heading>
                  <Link to="/requests">
                    <AtlantisButton type="tertiary" variation="subtle" size="small" icon="arrowRight" iconOnRight>
                      View All
                    </AtlantisButton>
                  </Link>
                </div>
              </AtlantisCard.Header>
              <AtlantisCard.Body>
                <DataList data={newRequests.slice(0, 5).map((request) => ({ ...request, id: request.id }))}>
                  <DataList.Layout gap="small">
                    {(request: Request) => (
                      <Link to={`/requests/${request.id}/show`} className="block">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <Text maxLines="single" className="font-medium">{request.title}</Text>
                            <Text variation="subdued" size="small">
                              <FormatDate date={request.createdAt} showYear useRelative />
                            </Text>
                          </div>
                          <StatusLabel
                            label={formatStatusLabel(request.status)}
                            status={requestStatusToSemantic[request.status]}
                          />
                        </div>
                      </Link>
                    )}
                  </DataList.Layout>
                  <DataList.EmptyState>
                    <div className="text-center py-8">
                      <Icon name="successCircle" size="large" color="greyBlue" />
                      <Text variation="subdued" className="mt-2">All caught up! No new requests</Text>
                    </div>
                  </DataList.EmptyState>
                </DataList>
              </AtlantisCard.Body>
            </AtlantisCard>
          </Container>

          {/* First Job Location Map */}
          {stats?.todaysJobs?.[0]?.address && (
            <Container variant="elevated" padding="none">
              <AtlantisCard>
                <AtlantisCard.Header>
                  <div className="flex flex-row items-center justify-between px-4 py-3">
                    <Heading level={4}>First job location</Heading>
                    <Text variation="subdued" size="small">
                      {stats.todaysJobs[0].address.street}, {stats.todaysJobs[0].address.city}
                    </Text>
                  </div>
                </AtlantisCard.Header>
                <AtlantisCard.Body>
                  <ClientLocationMap
                    address={stats.todaysJobs[0].address as Address}
                    clientName={stats.todaysJobs[0].title}
                  />
                </AtlantisCard.Body>
              </AtlantisCard>
            </Container>
          )}
        </div>
      </Page>

      {/* Job Quick Actions BottomSheet */}
      {jobQuickActions.sheet}
    </>
  );
};

export default DashboardPage;

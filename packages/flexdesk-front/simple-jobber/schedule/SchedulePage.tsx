import { useGetList, useUpdate, useRefresh, useNotify } from 'ra-core';
import {
  Card as AtlantisCard,
  Text,
  Icon,
  Heading,
  DataList,
  StatusLabel,
  Page,
  Grid,
  InlineBanner,
  Button,
} from '../components/atlantis';
import { Link, useNavigate } from 'react-router';
import type { Job, TeamMember } from '../types';
import type { JobUpdateInput } from '@service-flex/types';
import { jobPriorityToSemantic, formatStatusLabel } from '../types';
import { FlexDeskCalendar } from 'flexdesk-ui/calendar';

export const SchedulePage = () => {
  const navigate = useNavigate();
  const [update] = useUpdate();
  const refresh = useRefresh();
  const notify = useNotify();

  // Fetch all scheduled jobs (wider range to let Schedule-X handle view filtering)
  const { data: jobs, isLoading } = useGetList<Job>('jobs', {
    filter: {
      status_ne: 'UNSCHEDULED',
    },
    sort: { field: 'scheduledStartAt', order: 'ASC' },
    pagination: { page: 1, perPage: 200 },
  });


  // Fetch unscheduled jobs
  const { data: unscheduledJobs, isLoading: unscheduledLoading } = useGetList<Job>('jobs', {
    filter: { status: 'UNSCHEDULED' },
    sort: { field: 'priority', order: 'DESC' },
    pagination: { page: 1, perPage: 20 },
  });

  // Fetch team members (for future resource view)
  const { data: teamMembers } = useGetList<TeamMember>('teamMembers', {
    filter: { isActive: true },
    pagination: { page: 1, perPage: 50 },
  });

  const handleEventClick = (job: Job) => {
    navigate(`/jobs/${job.id}`);
  };

  const handleEventUpdate = async (updatedJob: Partial<JobUpdateInput>) => {
    if (!updatedJob.id) return;
    try {
      const { id, ...data } = updatedJob;
      await update(
        'jobs',
        { id, data, previousData: jobs?.find((j) => j.id === id) },
        { mutationMode: 'pessimistic' },
      );
      notify('Job rescheduled', { type: 'success' });
      refresh();
    } catch (error) {
      notify('Failed to reschedule job. Please try again.', { type: 'error' });
      // Re-throw so FlexDeskCalendar can revert the event to its original position
      throw error;
    }
  };

  const handleEventCreate = (newEvent: { start: string; end: string; resourceId?: string }) => {
    const params = new URLSearchParams({
      scheduledDate: newEvent.start.slice(0, 10),
      scheduledStartTime: newEvent.start.slice(11, 16),
      scheduledEndTime: newEvent.end.slice(11, 16),
    });
    if (newEvent.resourceId) {
      params.set('assignedTechnicianId', newEvent.resourceId);
    }
    navigate(`/jobs/create?${params.toString()}`);
  };

  const handleScheduleJob = async (
    job: Job,
    schedule: { scheduledDate: string; scheduledStartTime: string; scheduledEndTime: string; assignedTechnicianId?: string },
  ) => {
    try {
      await update(
        'jobs',
        {
          id: job.id,
          data: {
            ...schedule,
            status: 'SCHEDULED',
          },
          previousData: job,
        },
        { mutationMode: 'pessimistic' },
      );
      notify('Job scheduled successfully', { type: 'success' });
      refresh();
    } catch (error) {
      notify('Failed to schedule job. Please try again.', { type: 'error' });
    }
  };

  const hasUnscheduledJobs = !unscheduledLoading && unscheduledJobs && unscheduledJobs.length > 0;

  return (
    <Page title="Schedule">
      <Grid gap="large">
        {/* Calendar Section */}
        <Grid.Cell size={{ xs: 12, lg: hasUnscheduledJobs ? 9 : 12 }}>
          <div className="flex flex-col gap-3">
            <InlineBanner variant="info">
              Click a job to edit it. Drag and drop to reschedule. Click an empty slot to create a new job.
            </InlineBanner>
            <FlexDeskCalendar
              events={jobs ?? []}
              views={['day', 'week', 'month-grid', 'month-agenda']}
              defaultView="week"
              isLoading={isLoading}
              onEventClick={handleEventClick}
              onEventUpdate={handleEventUpdate}
              onEventCreate={handleEventCreate}
            />
          </div>
        </Grid.Cell>

        {/* Unscheduled Jobs Sidebar - only show when there are unscheduled jobs */}
        {hasUnscheduledJobs && <Grid.Cell size={{ xs: 12, lg: 3 }}>
          <AtlantisCard>
            <AtlantisCard.Header className="px-4 py-3">
              <div className="flex items-center gap-2">
                <Icon name="timer" size="small" />
                <Heading level={5}>Unscheduled Jobs</Heading>
              </div>
            </AtlantisCard.Header>
            <AtlantisCard.Body>
              <div className="h-[600px] overflow-auto">
                {unscheduledJobs!.some((job) => job.priority === 'HIGH' || job.priority === 'URGENT') && (
                  <div className="mb-3">
                    <InlineBanner variant="warning">
                      Some unscheduled jobs have high or urgent priority. Consider scheduling them soon.
                    </InlineBanner>
                  </div>
                )}
                <DataList data={unscheduledJobs!.map((job) => ({ ...job, id: job.id }))}>
                  <DataList.Layout gap="small">
                    {(job: Job) => (
                      <div>
                        <Link to={`/jobs/${job.id}/show`} className="block">
                          <Text size="small" maxLines="single" className="font-medium">
                            {job.title}
                          </Text>
                        </Link>
                        <div className="flex items-center gap-2 mt-2">
                          <StatusLabel
                            label={formatStatusLabel(job.priority)}
                            status={jobPriorityToSemantic[job.priority]}
                          />
                          {job.estimatedDuration && (
                            <Text size="small" variation="subdued">
                              {Math.floor(job.estimatedDuration / 60)}h {job.estimatedDuration % 60}m
                            </Text>
                          )}
                        </div>
                        <div className="mt-2">
                          <Button
                            size="small"
                            type="secondary"
                            fullWidth
                            onClick={() => {
                              const now = new Date();
                              const startHour = now.getHours();
                              const startMin = now.getMinutes() < 30 ? '00' : '30';
                              const endHour = startHour + 1;
                              const scheduledDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                              handleScheduleJob(job, {
                                scheduledDate,
                                scheduledStartTime: `${String(startHour).padStart(2, '0')}:${startMin}`,
                                scheduledEndTime: `${String(endHour).padStart(2, '0')}:${startMin}`,
                              });
                            }}
                          >
                            Schedule Now
                          </Button>
                        </div>
                      </div>
                    )}
                  </DataList.Layout>
                </DataList>
              </div>
            </AtlantisCard.Body>
          </AtlantisCard>
        </Grid.Cell>}
      </Grid>
    </Page>
  );
};

export default SchedulePage;

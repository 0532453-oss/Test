import { useGetList, useUpdate, useRefresh, useNotify } from 'ra-core';
import { useQueryClient } from '@tanstack/react-query';
import {
  Text,
  Icon,
  Heading,
  DataList,
  StatusLabel,
  InlineBanner,
  Button,
} from '@/atlantis';
import { Link, useNavigate } from 'react-router';
import type { Job } from '@/types';
import { jobPriorityToSemantic, formatStatusLabel } from '@/types';
import { FlexDeskCalendar, type FlexDeskCalendarProps } from 'flexdesk-ui/calendar';

// Type alias to work around Job type differences between local types and @service-flex/types
// The FlexDeskCalendar expects @service-flex/types.Job but we have local Job type
type CalendarJob = Parameters<NonNullable<FlexDeskCalendarProps['onEventClick']>>[0];
type CalendarJobUpdateInput = Parameters<NonNullable<FlexDeskCalendarProps['onEventUpdate']>>[0];

export const SchedulePage = () => {
  const navigate = useNavigate();
  const [update] = useUpdate();
  const refresh = useRefresh();
  const notify = useNotify();
  const queryClient = useQueryClient();

  // Fetch all scheduled jobs (wider range to let Schedule-X handle view filtering)
  const { data: jobs, isLoading } = useGetList<Job>('jobs', {
    filter: {
      status_ne: 'UNSCHEDULED',
    },
    sort: { field: 'scheduledDate', order: 'ASC' },
    pagination: { page: 1, perPage: 200 },
  });

  // Fetch unscheduled jobs
  const { data: unscheduledJobs, isLoading: unscheduledLoading } = useGetList<Job>('jobs', {
    filter: { status: 'UNSCHEDULED' },
    sort: { field: 'priority', order: 'DESC' },
    pagination: { page: 1, perPage: 20 },
  });

  const handleEventClick = (job: CalendarJob) => {
    navigate(`/jobs/${job.id}`);
  };

  const handleEventUpdate = async (updatedJob: CalendarJobUpdateInput) => {
    if (!updatedJob.id) return;
    try {
      const { id, ...data } = updatedJob;
      await update(
        'jobs',
        { id, data, previousData: jobs?.find((j) => j.id === id) },
        { mutationMode: 'pessimistic' },
      );
      notify('Job rescheduled', { type: 'success' });
      
      // Invalidate all job-related queries to ensure all components refresh
      // This includes React Admin queries (which use React Query under the hood)
      // Using a predicate to match all queries that start with 'jobs'
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === 'jobs';
        },
      });
      
      // Also use React Admin's refresh as a fallback
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
      
      // Invalidate all job-related queries to ensure all components refresh
      // Using a predicate to match all queries that start with 'jobs'
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === 'jobs';
        },
      });
      
      // Also use React Admin's refresh as a fallback
      refresh();
    } catch (error) {
      notify('Failed to schedule job. Please try again.', { type: 'error' });
    }
  };

  const hasUnscheduledJobs = !unscheduledLoading && unscheduledJobs && unscheduledJobs.length > 0;

  return (
    <div
      className="flex"
      style={{
        height: '100vh',
        width: '100%',
      }}
    >
        {/* Calendar Section */}
        <div className="flex-1 min-w-0 schedule-page-calendar">
          <FlexDeskCalendar
            events={(jobs ?? []) as unknown as CalendarJob[]}
            views={['day', 'week', 'month-grid', 'month-agenda']}
            defaultView="week"
            isLoading={isLoading}
            onEventClick={handleEventClick}
            onEventUpdate={handleEventUpdate}
            onEventCreate={handleEventCreate}
          />
        </div>

        {/* Unscheduled Jobs Sidebar - only show when there are unscheduled jobs */}
        {hasUnscheduledJobs && (
          <div className="hidden lg:flex lg:flex-col w-80 border-l border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden flex-shrink-0">
            <div className="px-4 py-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <Icon name="timer" size="small" />
                <Heading level={5}>Unscheduled Jobs</Heading>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {unscheduledJobs!.some((job) => job.priority === 'HIGH' || job.priority === 'URGENT') && (
                <div className="mb-3">
                  <InlineBanner variant="warning">
                    High priority jobs need scheduling
                  </InlineBanner>
                </div>
              )}
              <DataList data={unscheduledJobs!.map((job) => ({ ...job, id: job.id }))}>
                <DataList.Layout gap="small">
                  {(item) => {
                    const job = item as unknown as Job;
                    return (
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
                              const endHour = Math.min(startHour + 1, 23);
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
                    );
                  }}
                </DataList.Layout>
              </DataList>
            </div>
          </div>
        )}
    </div>
  );
};

export default SchedulePage;

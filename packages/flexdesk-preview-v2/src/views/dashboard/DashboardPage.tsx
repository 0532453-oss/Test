import { useMemo } from 'react'
import { useGetList } from 'ra-core'
import { useNavigate } from 'react-router-dom'
import { Heading, Text, Icon, Spinner, StatusLabel } from '@/atlantis'
import { ROUTES } from '@/app/routes/routes'
import {
  type Job,
  type Invoice,
  jobStatusToSemantic,
  formatStatusLabel,
} from '@/types'

function KpiCard({
  label,
  value,
  subtitle,
  icon,
  iconColor,
  onClick,
}: {
  label: string
  value: number | string
  subtitle: string
  icon: React.ComponentProps<typeof Icon>['name']
  iconColor: React.ComponentProps<typeof Icon>['color']
  onClick?: () => void
}) {
  return (
    <div
      className={`rounded-lg border border-solid border-[#DADFE2] bg-white px-4 py-3 transition-all duration-200${onClick ? ' cursor-pointer hover:border-[#7C8A94] hover:shadow-md' : ''}`}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center justify-between mb-2">
        <Text variation="subdued" size="small">
          {label}
        </Text>
        <Icon name={icon} color={iconColor} size="small" />
      </div>
      <Heading level={2}>{value}</Heading>
      <Text variation="subdued" size="small">
        {subtitle}
      </Text>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-solid border-[#DADFE2] bg-white px-4 py-3"
          >
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-solid border-[#DADFE2] bg-white p-4">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-12 bg-gray-100 rounded animate-pulse mb-2"
            />
          ))}
        </div>
        <div className="rounded-lg border border-solid border-[#DADFE2] bg-white p-4">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 bg-gray-100 rounded animate-pulse mb-2"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="p-6 space-y-6">
      <Heading level={1}>Dashboard</Heading>
      <div className="flex flex-col items-center justify-center py-16 rounded-lg border border-dashed border-[#DADFE2] bg-white">
        <Icon name="dashboard" size="large" color="greyBlue" />
        <Heading level={3}>Welcome to FlexDesk</Heading>
        <Text variation="subdued">
          Get started by creating your first job or adding a client.
        </Text>
        <div className="flex gap-3 mt-4">
          <a
            href={ROUTES.JOB_CREATE}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-interactive)] text-white text-sm font-medium hover:opacity-90 transition-opacity no-underline"
          >
            <Icon name="add" size="small" color="white" />
            Create Job
          </a>
          <a
            href={ROUTES.CLIENT_CREATE}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#DADFE2] bg-white text-sm font-medium hover:bg-gray-50 transition-colors no-underline text-[var(--color-text)]"
          >
            <Icon name="add" size="small" />
            Add Client
          </a>
        </div>
      </div>
    </div>
  )
}

export const DashboardPage = () => {
  const navigate = useNavigate()

  const today = new Date().toISOString().split('T')[0]

  const {
    data: jobs,
    isLoading: jobsLoading,
  } = useGetList<Job>('jobs', {
    sort: { field: 'createdAt', order: 'DESC' },
    pagination: { page: 1, perPage: 200 },
  })

  const {
    data: invoices,
    isLoading: invoicesLoading,
  } = useGetList<Invoice>('invoices', {
    sort: { field: 'createdAt', order: 'DESC' },
    pagination: { page: 1, perPage: 200 },
  })

  const isLoading = jobsLoading || invoicesLoading

  const metrics = useMemo(() => {
    if (!jobs) return null
    const todayJobs = jobs.filter(
      (j) => j.scheduledDate === today,
    )
    return {
      totalToday: todayJobs.length,
      inProgress: jobs.filter((j) => j.status === 'IN_PROGRESS').length,
      completedToday: todayJobs.filter((j) => j.status === 'COMPLETED').length,
      overdueInvoices: invoices
        ? invoices.filter((inv) => inv.status === 'OVERDUE').length
        : 0,
      unscheduled: jobs.filter(
        (j) => !j.scheduledDate,
      ).length,
    }
  }, [jobs, invoices, today])

  const todaysJobs = useMemo(() => {
    if (!jobs) return []
    return jobs
      .filter(
        (j) => j.scheduledDate === today,
      )
      .sort((a, b) => {
        const aTime = a.scheduledStartTime || ''
        const bTime = b.scheduledStartTime || ''
        return aTime.localeCompare(bTime)
      })
      .slice(0, 5)
  }, [jobs, today])

  const recentJobs = useMemo(() => {
    if (!jobs) return []
    return jobs
      .filter((j) => j.status !== 'COMPLETED' && j.status !== 'CANCELLED')
      .slice(0, 5)
  }, [jobs])

  if (isLoading) return <DashboardSkeleton />

  const isEmpty = (!jobs || jobs.length === 0) && (!invoices || invoices.length === 0)
  if (isEmpty) return <EmptyState />

  return (
    <div className="p-6 space-y-6">
      <Heading level={1}>Dashboard</Heading>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Jobs Today"
          value={metrics?.totalToday ?? 0}
          subtitle="Scheduled for today"
          icon="calendar"
          iconColor="blue"
          onClick={() => navigate(ROUTES.SCHEDULE)}
        />
        <KpiCard
          label="In Progress"
          value={metrics?.inProgress ?? 0}
          subtitle="Currently active"
          icon="timer"
          iconColor="orange"
          onClick={() => navigate(ROUTES.JOBS)}
        />
        <KpiCard
          label="Completed Today"
          value={metrics?.completedToday ?? 0}
          subtitle="Finished today"
          icon="checkmark"
          iconColor="green"
        />
        <KpiCard
          label="Overdue Invoices"
          value={metrics?.overdueInvoices ?? 0}
          subtitle="Require attention"
          icon="invoice"
          iconColor="red"
          onClick={() => navigate(ROUTES.INVOICES)}
        />
      </div>

      {/* Unscheduled Jobs Banner */}
      {(metrics?.unscheduled ?? 0) > 0 && (
        <div
          className="flex items-center justify-between px-4 py-3 rounded-lg border border-solid border-amber-200 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => navigate(ROUTES.SCHEDULE)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              navigate(ROUTES.SCHEDULE)
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center gap-2">
            <Icon name="warning" color="orange" size="small" />
            <Text>
              <strong>{metrics?.unscheduled}</strong> unscheduled job
              {metrics?.unscheduled !== 1 ? 's' : ''} need attention
            </Text>
          </div>
          <Icon name="arrowRight" size="small" />
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Jobs */}
        <div className="rounded-lg border border-solid border-[#DADFE2] bg-white">
          <div className="px-4 py-3 border-b border-[#DADFE2] flex items-center justify-between">
            <Heading level={3}>Today&apos;s Jobs</Heading>
            <a
              href={ROUTES.SCHEDULE}
              className="text-sm text-[var(--color-interactive)] hover:underline no-underline"
            >
              View schedule
            </a>
          </div>
          {todaysJobs.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <Icon name="calendar" color="greyBlue" />
              <Text variation="subdued">No jobs scheduled for today</Text>
            </div>
          ) : (
            <div className="divide-y divide-[#DADFE2]">
              {todaysJobs.map((job) => (
                <div
                  key={job.id}
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(`/jobs/${job.id}`)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="min-w-0 flex-1">
                    <Text>{job.title}</Text>
                    <Text variation="subdued" size="small">
                      {job.scheduledStartTime ?? 'No time set'}
                    </Text>
                  </div>
                  <StatusLabel
                    label={formatStatusLabel(job.status)}
                    status={jobStatusToSemantic[job.status] ?? 'inactive'}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Active Jobs */}
        <div className="rounded-lg border border-solid border-[#DADFE2] bg-white">
          <div className="px-4 py-3 border-b border-[#DADFE2] flex items-center justify-between">
            <Heading level={3}>Active Jobs</Heading>
            <a
              href={ROUTES.JOBS}
              className="text-sm text-[var(--color-interactive)] hover:underline no-underline"
            >
              View all jobs
            </a>
          </div>
          {recentJobs.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <Icon name="job" color="greyBlue" />
              <Text variation="subdued">No active jobs</Text>
            </div>
          ) : (
            <div className="divide-y divide-[#DADFE2]">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(`/jobs/${job.id}`)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="min-w-0 flex-1">
                    <Text>{job.title}</Text>
                    <Text variation="subdued" size="small">
                      {job.priority}
                    </Text>
                  </div>
                  <StatusLabel
                    label={formatStatusLabel(job.status)}
                    status={jobStatusToSemantic[job.status] ?? 'inactive'}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage

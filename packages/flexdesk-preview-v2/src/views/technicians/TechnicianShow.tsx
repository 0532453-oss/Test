import { useRecordContext, useGetList } from 'ra-core'
import { Show } from '@/components/admin'
import { Link } from 'react-router'
import { useMemo } from 'react'
import {
  jobStatusToSemantic,
  formatStatusLabel,
  type TeamMember,
  type Job,
} from '@/types'
import { Highlights, type HighlightItem } from '@/components/Highlights'
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
  FormatEmail,
  Avatar,
  DataTable,
  createColumnHelper,
  FormatDate,
} from '@/atlantis'

const roleLabels: Record<string, string> = {
  ADMIN: 'Admin',
  DISPATCHER: 'Dispatcher',
  TECHNICIAN: 'Technician',
}

const roleSemantic: Record<string, 'informative' | 'warning' | 'success'> = {
  ADMIN: 'informative',
  DISPATCHER: 'warning',
  TECHNICIAN: 'success',
}

const jobColumnHelper = createColumnHelper<Job>()

const TechnicianShowContent = () => {
  const record = useRecordContext<TeamMember>()

  // Fetch assigned jobs for this technician
  const { data: jobs } = useGetList<Job>('jobs', {
    pagination: { page: 1, perPage: 100 },
    filter: { technicianId: record?.id },
  }, { enabled: !!record?.id })

  const jobColumns = useMemo(() => [
    jobColumnHelper.accessor('title', {
      header: 'Title',
      cell: (info) => (
        <Link
          to={`/jobs/${info.row.original.id}`}
          className="text-[var(--color-interactive)] hover:text-[var(--color-interactive--hover)] hover:underline font-medium"
        >
          {info.getValue()}
        </Link>
      ),
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
        const value = info.getValue()
        return value ? <FormatDate date={new Date(`${value}T00:00:00`)} /> : '—'
      },
    }),
    jobColumnHelper.accessor('priority', {
      header: 'Priority',
      cell: (info) => formatStatusLabel(info.getValue()),
    }),
  ], [])

  if (!record) return null

  // Calculate highlights
  const activeJobs = jobs?.filter((job) =>
    ['SCHEDULED', 'DISPATCHED', 'EN_ROUTE', 'IN_PROGRESS'].includes(job.status)
  ).length || 0
  const completedJobs = jobs?.filter((job) => job.status === 'COMPLETED').length || 0
  const totalJobs = jobs?.length || 0

  const highlights: HighlightItem[] = [
    {
      label: 'Active Jobs',
      value: activeJobs.toString(),
      icon: <Icon name="work" size="small" />,
      className: activeJobs > 0 ? 'text-green-600' : undefined,
    },
    {
      label: 'Completed Jobs',
      value: completedJobs.toString(),
      icon: <Icon name="checkmark" size="small" />,
    },
    {
      label: 'Total Jobs',
      value: totalJobs.toString(),
      icon: <Icon name="list" size="small" />,
    },
    {
      label: 'Status',
      value: (
        <StatusLabel
          label={record.isActive ? 'Available' : 'Unavailable'}
          status={record.isActive ? 'success' : 'inactive'}
        />
      ),
      icon: <Icon name="person" size="small" />,
    },
  ]

  // Custom title with avatar and role
  const pageTitle = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <Avatar
          initials={record.name?.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2) || '?'}
          name={record.name}
          size="large"
          color="var(--color-interactive)"
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
      <div className="flex items-center gap-2 rounded-lg bg-[var(--color-surface--background)] px-3 py-1.5">
        <StatusLabel
          label={roleLabels[record.role] || record.role}
          status={roleSemantic[record.role] || 'inactive'}
        />
        <StatusLabel
          label={record.isActive ? 'Available' : 'Unavailable'}
          status={record.isActive ? 'success' : 'inactive'}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Page Title */}
      {pageTitle}

      {/* Highlights Section */}
      <Highlights items={highlights} />

      {/* Tabs */}
      <div className="mt-6">
        <Tabs defaultTab={0}>
          <Tab label="Overview">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Contact Information */}
              <Card>
                <Card.Header className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      <Icon name="person" size="small" />
                    </div>
                    <Heading level={4}>Contact Information</Heading>
                  </div>
                </Card.Header>
                <Card.Body>
                  <DescriptionList
                    data={[
                      { label: 'Email', value: record.email ? <FormatEmail email={record.email} /> : '—' },
                      { label: 'Phone', value: record.phone || '—' },
                    ]}
                  />
                </Card.Body>
              </Card>

              {/* Role & Details */}
              <Card>
                <Card.Header className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <Icon name="work" size="small" />
                    </div>
                    <Heading level={4}>Role & Details</Heading>
                  </div>
                </Card.Header>
                <Card.Body>
                  <DescriptionList
                    data={[
                      {
                        label: 'Role',
                        value: (
                          <StatusLabel
                            label={roleLabels[record.role] || record.role}
                            status={roleSemantic[record.role] || 'inactive'}
                          />
                        ),
                      },
                      {
                        label: 'Availability',
                        value: (
                          <StatusLabel
                            label={record.isActive ? 'Available' : 'Unavailable'}
                            status={record.isActive ? 'success' : 'inactive'}
                          />
                        ),
                      },
                      {
                        label: 'Member Since',
                        value: record.createdAt
                          ? <FormatDate date={new Date(record.createdAt)} />
                          : '—',
                      },
                    ]}
                  />
                </Card.Body>
              </Card>
            </div>
          </Tab>

          <Tab label="Assigned Jobs">
            <Card>
              <Card.Header className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                    <Icon name="work" size="small" />
                  </div>
                  <Heading level={4}>Assigned Jobs</Heading>
                </div>
              </Card.Header>
              <Card.Body>
                {jobs && jobs.length > 0 ? (
                  <DataTable
                    data={jobs}
                    columns={jobColumns as any}
                  />
                ) : (
                  <Text variation="subdued" size="small">No jobs assigned</Text>
                )}
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      </div>
    </div>
  )
}

export const TechnicianShow = () => {
  return (
    <Show resource="teamMembers" title={false} disableBreadcrumb>
      <TechnicianShowContent />
    </Show>
  )
}

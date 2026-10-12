import { Link } from 'react-router-dom'
import { CCard, CCardBody } from '@coreui/react'
import { format } from 'date-fns'
import { routes } from '@app/routes'
import { JobStatusBadge } from './JobStatusBadge'
import { JobPriorityBadge } from './JobPriorityBadge'
import type { Job } from '../types'

interface Props {
  job: Job
}

export function JobCard({ job }: Props) {
  return (
    <CCard className="mb-3 h-100">
      <CCardBody>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Link
            to={routes.jobDetail(job.id)}
            className="h6 mb-0 text-decoration-none"
          >
            {job.title}
          </Link>
          <JobStatusBadge status={job.status} />
        </div>

        {job.description && (
          <p className="text-medium-emphasis small mb-2 text-truncate">
            {job.description}
          </p>
        )}

        <div className="d-flex justify-content-between align-items-center">
          <JobPriorityBadge priority={job.priority} />
          {job.scheduledAt && (
            <small className="text-medium-emphasis">
              {format(new Date(job.scheduledAt), 'MMM d, h:mm a')}
            </small>
          )}
        </div>
      </CCardBody>
    </CCard>
  )
}

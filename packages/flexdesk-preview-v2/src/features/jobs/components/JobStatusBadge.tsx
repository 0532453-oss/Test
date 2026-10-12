import { CBadge } from '@coreui/react'
import type { JobStatus } from '../types'

const statusConfig: Record<JobStatus, { color: string; label: string }> = {
  SCHEDULED: { color: 'info', label: 'Scheduled' },
  DISPATCHED: { color: 'primary', label: 'Dispatched' },
  IN_PROGRESS: { color: 'warning', label: 'In Progress' },
  COMPLETED: { color: 'success', label: 'Completed' },
  CANCELLED: { color: 'danger', label: 'Cancelled' },
  ON_HOLD: { color: 'secondary', label: 'On Hold' },
}

interface Props {
  status: JobStatus
}

export function JobStatusBadge({ status }: Props) {
  const config = statusConfig[status] || statusConfig.SCHEDULED

  return (
    <CBadge color={config.color} shape="rounded-pill">
      {config.label}
    </CBadge>
  )
}

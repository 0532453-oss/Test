import { CBadge } from '@coreui/react'
import type { JobPriority } from '../types'

const priorityConfig: Record<JobPriority, { color: string; label: string }> = {
  LOW: { color: 'light', label: 'Low' },
  MEDIUM: { color: 'secondary', label: 'Medium' },
  HIGH: { color: 'warning', label: 'High' },
  URGENT: { color: 'danger', label: 'Urgent' },
}

interface Props {
  priority: JobPriority
}

export function JobPriorityBadge({ priority }: Props) {
  const config = priorityConfig[priority] || priorityConfig.MEDIUM

  return (
    <CBadge color={config.color} shape="rounded-pill">
      {config.label}
    </CBadge>
  )
}

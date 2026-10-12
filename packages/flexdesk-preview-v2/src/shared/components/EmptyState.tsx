import type { ReactNode } from 'react'
import { CCard, CCardBody } from '@coreui/react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <CCard className="border-0 shadow-sm">
      <CCardBody className="text-center py-5">
        {icon && <div className="mb-3 text-medium-emphasis">{icon}</div>}
        <h5 className="mb-2">{title}</h5>
        {description && (
          <p className="text-medium-emphasis mb-4">{description}</p>
        )}
        {action}
      </CCardBody>
    </CCard>
  )
}

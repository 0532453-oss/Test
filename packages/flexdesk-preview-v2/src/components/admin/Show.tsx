import type { ShowBaseProps } from 'ra-core'
import {
  ShowBase,
  Translate,
  useShowContext,
  useCreatePath,
  useGetResourceLabel,
  useResourceContext,
} from 'ra-core'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { CContainer, CBreadcrumb, CBreadcrumbItem } from '@coreui/react'

export type ShowProps = ShowViewProps & ShowBaseProps

/**
 * A complete show page with breadcrumb, title, and actions.
 */
export const Show = ({
  actions,
  children,
  className,
  disableBreadcrumb,
  title,
  breadcrumbLabel,
  breadcrumbListLabel,
  ...rest
}: ShowProps) => (
  <ShowBase {...rest}>
    <ShowView
      actions={actions}
      className={className}
      disableBreadcrumb={disableBreadcrumb}
      title={title}
      breadcrumbLabel={breadcrumbLabel}
      breadcrumbListLabel={breadcrumbListLabel}
    >
      {children}
    </ShowView>
  </ShowBase>
)

export type ShowViewProps = {
  actions?: ReactNode
  disableBreadcrumb?: boolean
  children: ReactNode
  className?: string
  title?: ReactNode | string | false
  breadcrumbLabel?: ReactNode | string
  breadcrumbListLabel?: ReactNode | string
}

/**
 * The view component for Show pages with layout and UI.
 */
export const ShowView = ({
  actions,
  disableBreadcrumb,
  title,
  children,
  className,
  breadcrumbLabel,
  breadcrumbListLabel,
}: ShowViewProps) => {
  const context = useShowContext()

  const resource = useResourceContext()
  if (!resource) {
    throw new Error(
      'The ShowView component must be used within a ResourceContextProvider'
    )
  }
  const getResourceLabel = useGetResourceLabel()
  const defaultListLabel = getResourceLabel(resource, 2)
  const listLabel = breadcrumbListLabel || defaultListLabel
  const createPath = useCreatePath()
  const listLink = createPath({
    resource,
    type: 'list',
  })

  // Breadcrumb label options (in order of preference):
  // 1. Custom prop breadcrumbLabel
  // 2. Record title from context (if available)
  // 3. Default "Show" translation
  const showLabel = breadcrumbLabel || context.defaultTitle || (
    <Translate i18nKey="ra.action.show">Show</Translate>
  )

  return (
    <CContainer lg>
      {!disableBreadcrumb && (
        <CBreadcrumb className="mb-4">
          <CBreadcrumbItem>
            <Link to={listLink}>{listLabel}</Link>
          </CBreadcrumbItem>
          <CBreadcrumbItem active>
            {showLabel}
          </CBreadcrumbItem>
        </CBreadcrumb>
      )}
      <div
        className={cn(
          'flex justify-between items-start flex-wrap gap-2 my-2',
          className
        )}
      >
        {title !== false && (
          <h2 className="text-2xl font-bold tracking-tight">
            {title !== undefined ? title : context.defaultTitle}
          </h2>
        )}
        {actions}
      </div>
      <div className="my-2">{children}</div>
    </CContainer>
  )
}

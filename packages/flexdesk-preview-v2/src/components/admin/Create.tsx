import type { CreateBaseProps } from 'ra-core'
import {
  CreateBase,
  Translate,
  useCreateContext,
  useCreatePath,
  useGetResourceLabel,
  useResourceContext,
} from 'ra-core'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { CContainer, CBreadcrumb, CBreadcrumbItem } from '@coreui/react'

export type CreateProps = CreateViewProps & CreateBaseProps

/**
 * A complete create page with breadcrumb, title, and actions.
 */
export const Create = ({
  actions,
  children,
  className,
  disableBreadcrumb,
  title,
  fullWidth,
  ...rest
}: CreateProps) => (
  <CreateBase {...rest}>
    <CreateView
      actions={actions}
      className={className}
      disableBreadcrumb={disableBreadcrumb}
      title={title}
      fullWidth={fullWidth}
    >
      {children}
    </CreateView>
  </CreateBase>
)

export type CreateViewProps = {
  actions?: ReactNode
  disableBreadcrumb?: boolean
  children: ReactNode
  className?: string
  title?: ReactNode | string | false
  fullWidth?: boolean
}

/**
 * The view component for Create pages with layout and UI.
 */
export const CreateView = ({
  actions,
  disableBreadcrumb,
  title,
  children,
  className,
  fullWidth,
}: CreateViewProps) => {
  const context = useCreateContext()

  const resource = useResourceContext()
  if (!resource) {
    throw new Error(
      'The CreateView component must be used within a ResourceContextProvider'
    )
  }
  const getResourceLabel = useGetResourceLabel()
  const listLabel = getResourceLabel(resource, 2)
  const createPath = useCreatePath()
  const listLink = createPath({
    resource,
    type: 'list',
  })

  const content = (
    <>
      {!disableBreadcrumb && (
        <CBreadcrumb className="mb-4">
          <CBreadcrumbItem>
            <Link to={listLink}>{listLabel}</Link>
          </CBreadcrumbItem>
          <CBreadcrumbItem active>
            <Translate i18nKey="ra.action.create">Create</Translate>
          </CBreadcrumbItem>
        </CBreadcrumb>
      )}
      <div
        className={cn(
          'flex justify-between items-start flex-wrap gap-2 my-2',
          className
        )}
      >
        <h2 className="text-2xl font-bold tracking-tight">
          {title !== undefined ? title : context.defaultTitle}
        </h2>
        {actions}
      </div>
      <div className="my-2 w-full">{children}</div>
    </>
  )

  return fullWidth ? (
    <div className="w-full">{content}</div>
  ) : (
    <CContainer lg>{content}</CContainer>
  )
}

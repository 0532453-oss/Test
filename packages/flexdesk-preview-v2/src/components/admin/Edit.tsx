import type { EditBaseProps } from 'ra-core'
import {
  EditBase,
  Translate,
  useEditContext,
  useCreatePath,
  useGetResourceLabel,
  useResourceContext,
} from 'ra-core'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { CContainer, CBreadcrumb, CBreadcrumbItem } from '@coreui/react'

export type EditProps = EditViewProps & EditBaseProps

/**
 * A complete edit page with breadcrumb, title, and actions.
 */
export const Edit = ({
  actions,
  children,
  className,
  disableBreadcrumb,
  title,
  ...rest
}: EditProps) => (
  <EditBase {...rest}>
    <EditView
      actions={actions}
      className={className}
      disableBreadcrumb={disableBreadcrumb}
      title={title}
    >
      {children}
    </EditView>
  </EditBase>
)

export type EditViewProps = {
  actions?: ReactNode
  disableBreadcrumb?: boolean
  children: ReactNode
  className?: string
  title?: ReactNode | string | false
}

/**
 * The view component for Edit pages with layout and UI.
 */
export const EditView = ({
  actions,
  disableBreadcrumb,
  title,
  children,
  className,
}: EditViewProps) => {
  const context = useEditContext()

  const resource = useResourceContext()
  if (!resource) {
    throw new Error(
      'The EditView component must be used within a ResourceContextProvider'
    )
  }
  const getResourceLabel = useGetResourceLabel()
  const listLabel = getResourceLabel(resource, 2)
  const createPath = useCreatePath()
  const listLink = createPath({
    resource,
    type: 'list',
  })

  return (
    <CContainer lg>
      {!disableBreadcrumb && (
        <CBreadcrumb className="mb-4">
          <CBreadcrumbItem>
            <Link to={listLink}>{listLabel}</Link>
          </CBreadcrumbItem>
          <CBreadcrumbItem active>
            <Translate i18nKey="ra.action.edit">Edit</Translate>
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
      <div className="my-2">{children}</div>
    </CContainer>
  )
}

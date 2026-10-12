import * as React from 'react'
import { createPortal } from 'react-dom'
import { Separator } from '@/components/ui/separator'
import {
  CBreadcrumb,
  CBreadcrumbItem,
} from '@coreui/react'
import { Drawer, useBreakpoints, Icon } from '@/atlantis'
import { Translate } from 'ra-core'

/**
 * A breadcrumb navigation component with mobile drawer support.
 *
 * Renders breadcrumb navigation in the app header via portal. On mobile, shows a drawer with
 * ellipsis for long breadcrumb trails. Use Breadcrumb.Item and Breadcrumb.PageItem as children.
 *
 * CRUD pages already include a Breadcrumb by default; set `disableBreadcrumb` to hide the
 * breadcrumb and/or provide your own.
 *
 * @example
 * import { Edit, Breadcrumb, AtlantisSimpleForm } from "@/components/admin";
 * import { RecordRepresentation } from 'ra-core';
 * import { Link } from "react-router";
 *
 * const PostEdit = () => (
 *   <Edit disableBreadcrumb>
 *     <Breadcrumb>
 *       <Breadcrumb.Item><Link to="/">Home</Link></Breadcrumb.Item>
 *       <Breadcrumb.Item><Link to="/posts">Articles</Link></Breadcrumb.Item>
 *       <Breadcrumb.PageItem>
 *         Edit Article "<RecordRepresentation />"
 *       </Breadcrumb.Item>
 *     </Breadcrumb>
 *     <AtlantisSimpleForm>
 *       ...
 *     </AtlantisSimpleForm>
 *   </Edit>
 * );
 */
export const Breadcrumb = ({ children }: BreadcrumbProps) => {
  const breadcrumbPortal = document.getElementById('breadcrumb')
  const { mediumAndUp } = useBreakpoints()
  const isMobile = !mediumAndUp
  const [open, setOpen] = React.useState(false)

  if (!breadcrumbPortal) return null

  return createPortal(
    <>
      <Separator
        decorative
        orientation="vertical"
        className="data-[orientation=vertical]:h-4 mr-4"
      />
      <CBreadcrumb className="mb-0">
        {isMobile && React.Children.count(children) > 2 ? (
          <React.Fragment>
            <CBreadcrumbItem>
              <button
                onClick={() => setOpen(true)}
                aria-label="Toggle Menu"
                className="inline-flex items-center justify-center"
              >
                <Icon name="more" size="small" />
              </button>
            </CBreadcrumbItem>
            {React.Children.toArray(children).slice(-1)}
            <Drawer
              open={open}
              title="Navigate to"
              onRequestClose={() => setOpen(false)}
            >
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground mb-2">
                  <Translate i18nKey="ra.navigation.breadcrumb_drawer_instructions">
                    Select a page to navigate to.
                  </Translate>
                </p>
                <ol className="grid gap-1">
                  {React.Children.toArray(children)
                    .slice(0, -1)
                    .map((item, index) => (
                      <li key={index} onClick={() => setOpen(false)}>
                        {item}
                      </li>
                    ))}
                </ol>
              </div>
            </Drawer>
          </React.Fragment>
        ) : (
          React.Children.map(children, (child) => child)
        )}
      </CBreadcrumb>
    </>,
    breadcrumbPortal
  )
}

/**
 * A breadcrumb item component for navigation links.
 */
export const BreadcrumbItem = ({
  children,
  ...props
}: React.ComponentProps<typeof CBreadcrumbItem>) => {
  return <CBreadcrumbItem {...props}>{children}</CBreadcrumbItem>
}

/**
 * A breadcrumb page item component for the current page (non-navigable).
 */
export const BreadcrumbPage = ({
  children,
  ...props
}: React.ComponentProps<typeof CBreadcrumbItem>) => {
  return (
    <CBreadcrumbItem active {...props}>
      {children}
    </CBreadcrumbItem>
  )
}

// Attach compound components
Breadcrumb.Item = BreadcrumbItem
Breadcrumb.PageItem = BreadcrumbPage

export type BreadcrumbProps = React.ComponentProps<'nav'>

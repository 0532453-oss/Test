import React from 'react'
import { useLocation } from 'react-router-dom'
import { CBreadcrumb, CBreadcrumbItem } from '@coreui/react'

// Route name mappings for breadcrumb display
// Will be replaced with routes.ts config in US-013
const routeNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/clients': 'Clients',
  '/clients/create': 'Create',
  '/jobs': 'Jobs',
  '/jobs/create': 'Create',
  '/requests': 'Requests',
  '/requests/create': 'Create',
  '/invoices': 'Invoices',
  '/invoices/create': 'Create',
  '/schedule': 'Schedule',
}

function getRouteName(pathname: string): string | null {
  // Check for exact match first
  if (routeNames[pathname]) {
    return routeNames[pathname]
  }

  // Check for dynamic routes like /clients/:id or /clients/:id/edit
  const segments = pathname.split('/')
  if (segments.length >= 3) {
    const basePath = `/${segments[1]}`
    const lastSegment = segments[segments.length - 1]

    // Handle /resource/:id/edit pattern
    if (lastSegment === 'edit') {
      return 'Edit'
    }

    // Handle /resource/:id pattern (show page)
    if (segments.length === 3 && routeNames[basePath]) {
      return 'View'
    }
  }

  return null
}

interface Breadcrumb {
  pathname: string
  name: string
  active: boolean
}

function getBreadcrumbs(location: string): Breadcrumb[] {
  const breadcrumbs: Breadcrumb[] = []
  const segments = location.split('/').filter(Boolean)

  segments.reduce((prev, curr, index, array) => {
    const currentPathname = `${prev}/${curr}`
    const routeName = getRouteName(currentPathname)

    if (routeName) {
      breadcrumbs.push({
        pathname: currentPathname,
        name: routeName,
        active: index + 1 === array.length,
      })
    }

    return currentPathname
  }, '')

  return breadcrumbs
}

function AppBreadcrumb() {
  const currentLocation = useLocation().pathname
  const breadcrumbs = getBreadcrumbs(currentLocation)

  return (
    <CBreadcrumb className="my-0">
      <CBreadcrumbItem href="/">Home</CBreadcrumbItem>
      {breadcrumbs.map((breadcrumb, index) => (
        <CBreadcrumbItem
          {...(breadcrumb.active
            ? { active: true }
            : { href: breadcrumb.pathname })}
          key={index}
        >
          {breadcrumb.name}
        </CBreadcrumbItem>
      ))}
    </CBreadcrumb>
  )
}

export default React.memo(AppBreadcrumb)

import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@app/providers'
import { FullPageSpinner } from '@shared/components'
import { ROUTES } from '@app/routes'

export function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <FullPageSpinner />
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <Outlet />
    </div>
  )
}

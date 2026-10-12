import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@app/providers'
import { FullPageSpinner } from '@shared/components'
import { ROUTES } from './routes'

interface Props {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <FullPageSpinner />
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}

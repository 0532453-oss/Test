import { Suspense, type ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryProvider } from './QueryProvider'
import { AuthProvider } from './AuthProvider'
import { ToastProvider } from './ToastProvider'
import { ErrorBoundary } from './ErrorBoundary'
import { DebugPanel } from './DebugPanel'
import { AdminContext } from '@/providers/AdminContext'
import { FullPageSpinner } from '@shared/components/FullPageSpinner'
import { env } from '@app/config'

interface Props {
  children: ReactNode
}

export function AppProviders({ children }: Props) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <BrowserRouter>
          <AdminContext>
            <AuthProvider>
              <ToastProvider>
                <Suspense fallback={<FullPageSpinner />}>
                  {children}
                </Suspense>
                {env.IS_DEV && <DebugPanel />}
              </ToastProvider>
            </AuthProvider>
          </AdminContext>
        </BrowserRouter>
      </QueryProvider>
    </ErrorBoundary>
  )
}

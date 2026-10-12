import type { ReactNode } from 'react'
import { CoreAdminContext, localStorageStore, type DataProvider } from 'ra-core'
import { dataProvider as mockDataProvider } from './dataProvider'
import { apiDataProvider } from './apiDataProvider'
import { createAuthProvider } from '@service-flex/core/auth'
import { queryClient } from '@app/providers/QueryProvider'
import { env } from '@app/config/env'
import { isDemoMode } from '@/mocks/demoMode'

// Demo auth provider for preview/demo mode (no real authentication)
const demoAuthProvider = {
  login: async () => Promise.resolve(),
  logout: async () => Promise.resolve(),
  checkAuth: async () => Promise.resolve(),
  checkError: async () => Promise.resolve(),
  getIdentity: async () => Promise.resolve({
    id: 'demo-user',
    email: 'demo@example.com',
    fullName: 'Demo User',
    role: 'admin',
  }),
  getPermissions: async () => Promise.resolve('admin'),
}

// Real auth provider from @service-flex/core
const realAuthProvider = createAuthProvider({
  apiUrl: env.API_URL,
})

// Select providers based on environment
const useRealProviders = !env.USE_MOCK_DATA && !isDemoMode()
// apiDataProvider already implements the core DataProvider interface;
// cast needed because ra-core's DataProvider has minor signature differences
const activeDataProvider: DataProvider = useRealProviders
  ? (apiDataProvider as unknown as DataProvider)
  : mockDataProvider
const activeAuthProvider = useRealProviders ? realAuthProvider : demoAuthProvider

// Default store for React Admin
const store = localStorageStore()

interface AdminContextProps {
  children: ReactNode
}

/**
 * AdminContext provider wrapper for FlexDesk Preview v2.
 *
 * Provides React Admin hooks (useGetList, useGetOne, useUpdate, etc.)
 * to child components via CoreAdminContext from ra-core.
 *
 * Uses the real apiDataProvider and createAuthProvider when connected
 * to the backend. Falls back to mock providers in demo mode or when
 * VITE_USE_MOCK_DATA=true.
 */
export function AdminContext({ children }: AdminContextProps) {
  return (
    <CoreAdminContext
      dataProvider={activeDataProvider}
      authProvider={activeAuthProvider}
      store={store}
      queryClient={queryClient}
    >
      {children}
    </CoreAdminContext>
  )
}

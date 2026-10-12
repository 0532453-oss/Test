import { Resource, CustomRoutes } from 'ra-core';
import { Route } from 'react-router';
import { Admin } from '@/components/admin';
import { createAuthProvider } from '@service-flex/core';

import { dataProvider } from './dataProvider';
import { DashboardPage } from './dashboard';
import { clients } from './clients';
import { jobs } from './jobs';
import { requests } from './requests';
import { invoices } from './invoices';
import { SchedulePage } from './schedule';
import { StripeOnboardingPage, PaymentSuccessPage } from './stripe';
import { ServiceProviderGrid } from './service-providers';
import { AppLayout, Icon } from './components';

/** Team members resource icon wrapper for React Admin */
const TeamMembersIcon = () => <Icon name="clients" />;

const teamMembers = {
  name: 'teamMembers',
  recordRepresentation: 'name',
  icon: TeamMembersIcon,
};

// Create auth provider for API authentication
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
const authProvider = createAuthProvider({ apiUrl: API_URL });

// Set to true to require authentication for all routes
// Disabled for preview mode when backend is not available
const REQUIRE_AUTH = false;

// Create a no-op auth provider for preview mode (no authentication required)
const noOpAuthProvider = {
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
};

export function SimpleJobberApp() {
  return (
    <Admin
      dataProvider={dataProvider}
      authProvider={REQUIRE_AUTH ? authProvider : noOpAuthProvider}
      dashboard={DashboardPage}
      layout={AppLayout}
      requireAuth={REQUIRE_AUTH}
    >
      <Resource {...clients} />
      <Resource {...jobs} />
      <Resource {...requests} />
      <Resource {...invoices} />
      <Resource {...teamMembers} />
      <CustomRoutes>
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/service-providers" element={<ServiceProviderGrid />} />
        <Route path="/stripe/onboarding" element={<StripeOnboardingPage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
      </CustomRoutes>
    </Admin>
  );
}

export default SimpleJobberApp;

export const ROUTES = {
  // Public
  LOGIN: '/login',

  // Dashboard
  HOME: '/',
  DASHBOARD: '/dashboard',

  // Clients
  CLIENTS: '/clients',
  CLIENT_DETAIL: '/clients/:id',
  CLIENT_CREATE: '/clients/create',
  CLIENT_EDIT: '/clients/:id/edit',

  // Jobs
  JOBS: '/jobs',
  JOB_DETAIL: '/jobs/:id',
  JOB_CREATE: '/jobs/create',
  JOB_EDIT: '/jobs/:id/edit',

  // Requests
  REQUESTS: '/requests',
  REQUEST_DETAIL: '/requests/:id',
  REQUEST_CREATE: '/requests/create',
  REQUEST_EDIT: '/requests/:id/edit',

  // Invoices
  INVOICES: '/invoices',
  INVOICE_DETAIL: '/invoices/:id',
  INVOICE_CREATE: '/invoices/create',
  INVOICE_EDIT: '/invoices/:id/edit',

  // Scheduling
  SCHEDULE: '/schedule',

  // Customers (legacy alias for clients)
  CUSTOMERS: '/customers',
  CUSTOMER_DETAIL: '/customers/:id',
  CUSTOMER_CREATE: '/customers/new',

  // Service Providers
  SERVICE_PROVIDERS: '/service-providers',
  SERVICE_PROVIDER_DETAIL: '/service-providers/:id',

  // Technicians
  TECHNICIANS: '/technicians',
  TECHNICIAN_DETAIL: '/technicians/:id',

  // Estimates
  ESTIMATES: '/estimates',
  ESTIMATE_DETAIL: '/estimates/:id',

  // Stripe
  STRIPE_ONBOARDING: '/stripe/onboarding',
  PAYMENT_SUCCESS: '/payment/success',

  // Settings
  SETTINGS: '/settings',
  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_WORKSPACE: '/settings/workspace',
  SETTINGS_TEAM: '/settings/team',
  SETTINGS_BILLING: '/settings/billing',
  SETTINGS_COMPANY_PROFILE: '/settings/company-profile',
} as const

// Dynamic route helpers
export const routes = {
  jobDetail: (id: string) => `/jobs/${id}`,
  jobEdit: (id: string) => `/jobs/${id}/edit`,
  customerDetail: (id: string) => `/customers/${id}`,
  technicianDetail: (id: string) => `/technicians/${id}`,
  invoiceDetail: (id: string) => `/invoices/${id}`,
  estimateDetail: (id: string) => `/estimates/${id}`,
  serviceProviderDetail: (id: string) => `/service-providers/${id}`,
}

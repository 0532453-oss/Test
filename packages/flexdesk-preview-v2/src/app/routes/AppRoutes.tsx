import { Routes, Route, Navigate } from 'react-router-dom'
import React, { lazy } from 'react'

import { MainLayout } from '@app/layouts/MainLayout'
import { AuthLayout } from '@app/layouts/AuthLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { ROUTES } from './routes'

// Auth pages
const Login = lazy(() => import('@features/auth/pages/Login'))
const AuthCallback = lazy(() => import('@features/auth/pages/AuthCallback'))

// Dashboard - from views
const Dashboard = lazy(() => import('../../views/dashboard/DashboardPage'))

// Clients - from views
const ClientList = lazy(() => import('../../views/clients/ClientList').then(m => ({ default: m.ClientList })))
const ClientCreate = lazy(() => import('../../views/clients/ClientCreate').then(m => ({ default: m.ClientCreate })))
const ClientEdit = lazy(() => import('../../views/clients/ClientEdit').then(m => ({ default: m.ClientEdit })))
const ClientShow = lazy(() => import('../../views/clients/ClientShow').then(m => ({ default: m.ClientShow })))

// Jobs - from views
const JobList = lazy(() => import('../../views/jobs/JobList').then(m => ({ default: m.JobList })))
const JobCreate = lazy(() => import('../../views/jobs/JobCreate').then(m => ({ default: m.JobCreate })))
const JobEdit = lazy(() => import('../../views/jobs/JobEdit').then(m => ({ default: m.JobEdit })))
const JobShow = lazy(() => import('../../views/jobs/JobShow').then(m => ({ default: m.JobShow })))

// Requests - from views
const RequestList = lazy(() => import('../../views/requests/RequestList').then(m => ({ default: m.RequestList })))
const RequestCreate = lazy(() => import('../../views/requests/RequestCreate').then(m => ({ default: m.RequestCreate })))
const RequestShow = lazy(() => import('../../views/requests/RequestShow').then(m => ({ default: m.RequestShow })))
const RequestEdit = lazy(() => import('../../views/requests/RequestEdit').then(m => ({ default: m.RequestEdit })))

// Invoices - from views
const InvoiceList = lazy(() => import('../../views/invoices/InvoiceList').then(m => ({ default: m.InvoiceList })))
const InvoiceCreate = lazy(() => import('../../views/invoices/InvoiceCreate').then(m => ({ default: m.InvoiceCreate })))
const InvoiceEdit = lazy(() => import('../../views/invoices/InvoiceEdit').then(m => ({ default: m.InvoiceEdit })))
const InvoiceShow = lazy(() => import('../../views/invoices/InvoiceShow').then(m => ({ default: m.InvoiceShow })))

// Estimates - from views
const EstimateList = lazy(() => import('../../views/estimates/EstimateList').then(m => ({ default: m.EstimateList })))
const EstimateShow = lazy(() => import('../../views/estimates/EstimateShow').then(m => ({ default: m.EstimateShow })))

// Service Providers - from views
const ServiceProviderList = lazy(() => import('../../views/service-providers/ServiceProviderList').then(m => ({ default: m.ServiceProviderList })))

// Technicians - from views
const TechnicianList = lazy(() => import('../../views/technicians/TechnicianList').then(m => ({ default: m.TechnicianList })))
const TechnicianShow = lazy(() => import('../../views/technicians/TechnicianShow').then(m => ({ default: m.TechnicianShow })))

// Schedule - from views
const Schedule = lazy(() => import('../../views/schedule/SchedulePage').then(m => ({ default: m.SchedulePage })))

// Stripe
const StripeOnboardingPage = lazy(() => import('../../views/stripe/StripeOnboardingPage').then(m => ({ default: m.StripeOnboardingPage })))
const PaymentSuccessPage = lazy(() => import('../../views/stripe/PaymentSuccessPage').then(m => ({ default: m.PaymentSuccessPage })))

// Settings
const SettingsLayout = lazy(() => import('../../views/settings/SettingsLayout').then(m => ({ default: m.SettingsLayout })))
const ProfilePage = lazy(() => import('../../views/settings/ProfilePage').then(m => ({ default: m.ProfilePage })))
const WorkspacePage = lazy(() => import('../../views/settings/WorkspacePage').then(m => ({ default: m.WorkspacePage })))
const TeamPage = lazy(() => import('../../views/settings/TeamPage').then(m => ({ default: m.TeamPage })))
const BillingPage = lazy(() => import('../../views/settings/BillingPage').then(m => ({ default: m.BillingPage })))
const CompanyProfile = lazy(() => import('../../views/settings/CompanyProfilePage').then(m => ({ default: m.CompanyProfilePage })))

// Not Found
const NotFound = lazy(() => import('../../views/NotFound'))

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<Login />} />
      </Route>

      {/* OAuth callback (public, no layout) */}
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />

        {/* Clients */}
        <Route path={ROUTES.CLIENTS} element={<ClientList />} />
        <Route path={ROUTES.CLIENT_CREATE} element={<ClientCreate />} />
        <Route path={ROUTES.CLIENT_DETAIL} element={<ClientShow />} />
        <Route path={ROUTES.CLIENT_EDIT} element={<ClientEdit />} />

        {/* Jobs */}
        <Route path={ROUTES.JOBS} element={<JobList />} />
        <Route path={ROUTES.JOB_CREATE} element={<JobCreate />} />
        <Route path={ROUTES.JOB_DETAIL} element={<JobShow />} />
        <Route path={ROUTES.JOB_EDIT} element={<JobEdit />} />

        {/* Requests */}
        <Route path={ROUTES.REQUESTS} element={<RequestList />} />
        <Route path={ROUTES.REQUEST_CREATE} element={<RequestCreate />} />
        <Route path={ROUTES.REQUEST_DETAIL} element={<RequestShow />} />
        <Route path={ROUTES.REQUEST_EDIT} element={<RequestEdit />} />

        {/* Invoices */}
        <Route path={ROUTES.INVOICES} element={<InvoiceList />} />
        <Route path={ROUTES.INVOICE_CREATE} element={<InvoiceCreate />} />
        <Route path={ROUTES.INVOICE_DETAIL} element={<InvoiceShow />} />
        <Route path={ROUTES.INVOICE_EDIT} element={<InvoiceEdit />} />

        {/* Estimates */}
        <Route path={ROUTES.ESTIMATES} element={<EstimateList />} />
        <Route path={ROUTES.ESTIMATE_DETAIL} element={<EstimateShow />} />

        {/* Service Providers */}
        <Route path={ROUTES.SERVICE_PROVIDERS} element={<ServiceProviderList />} />

        {/* Technicians */}
        <Route path={ROUTES.TECHNICIANS} element={<TechnicianList />} />
        <Route path={ROUTES.TECHNICIAN_DETAIL} element={<TechnicianShow />} />

        {/* Schedule */}
        <Route path={ROUTES.SCHEDULE} element={<Schedule />} />

        {/* Stripe */}
        <Route path={ROUTES.STRIPE_ONBOARDING} element={<StripeOnboardingPage />} />
        <Route path={ROUTES.PAYMENT_SUCCESS} element={<PaymentSuccessPage />} />

        {/* Settings */}
        <Route path={ROUTES.SETTINGS} element={<SettingsLayout />}>
          <Route index element={<Navigate to={ROUTES.SETTINGS_PROFILE} replace />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="workspace" element={<WorkspacePage />} />
          <Route path="company-profile" element={<CompanyProfile />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="billing" element={<BillingPage />} />
        </Route>
      </Route>

      {/* Redirects */}
      <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />

      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

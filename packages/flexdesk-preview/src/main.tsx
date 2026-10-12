import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import { SimpleJobberApp } from '../../flexdesk-front/simple-jobber/App';
import {
  PortalInvoicesPage,
  PortalInvoiceDetailPage,
  PortalJobsPage,
} from '../../flexdesk-web-admin/src/app/portal';
import './globals.css';


/**
 * Root application component that handles routing for both:
 * 1. Public customer portal routes (no authentication required)
 * 2. Admin dashboard routes (handled by React Admin)
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Customer Portal Routes */}
        <Route path="/portal/invoices" element={<PortalInvoicesPage />} />
        <Route path="/portal/invoices/:invoiceId" element={<PortalInvoiceDetailPage />} />
        <Route path="/portal/jobs" element={<PortalJobsPage />} />
        {/* Admin Dashboard Routes (handled by React Admin) */}
        <Route path="/*" element={<SimpleJobberApp />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

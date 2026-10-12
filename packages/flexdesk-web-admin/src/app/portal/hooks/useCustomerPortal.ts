import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface CustomerSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface PortalInvoice {
  id: string;
  invoiceNumber: string;
  status: string;
  amount: string;
  tax: string;
  total: string;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
  job: {
    id: string;
    title: string;
  } | null;
  lineItems: {
    description: string;
    quantity: string;
    unitPrice: string;
    total: string;
  }[];
}

export interface PortalJob {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduledAt: string | null;
  completedAt: string | null;
  technician: {
    id: string;
    name: string;
  } | null;
}

export interface CustomerPortalData {
  customer: CustomerSummary;
  invoices: PortalInvoice[];
  jobs: PortalJob[];
}

interface UseCustomerPortalDataResult {
  customer: CustomerSummary | null;
  invoices: PortalInvoice[];
  jobs: PortalJob[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface UseCustomerPortalInvoiceDetailResult {
  invoice: PortalInvoice | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

interface UseCustomerPortalJobDetailResult {
  job: PortalJob | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch full customer portal data (customer info, invoices, and jobs)
 */
export function useCustomerPortalData(
  token: string | null,
): UseCustomerPortalDataResult {
  const [customer, setCustomer] = useState<CustomerSummary | null>(null);
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [jobs, setJobs] = useState<PortalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError(new Error('No access token provided'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/customer-portal?token=${encodeURIComponent(token)}`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch portal data');
      }

      const data: CustomerPortalData = await response.json();
      setCustomer(data.customer);
      setInvoices(data.invoices);
      setJobs(data.jobs);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { customer, invoices, jobs, loading, error, refetch: fetchData };
}

/**
 * Fetch only invoices for the customer portal
 */
export function useCustomerPortalInvoices(
  token: string | null,
): { invoices: PortalInvoice[]; loading: boolean; error: Error | null; refetch: () => void } {
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError(new Error('No access token provided'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/customer-portal/invoices?token=${encodeURIComponent(token)}`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch invoices');
      }

      const data: PortalInvoice[] = await response.json();
      setInvoices(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { invoices, loading, error, refetch: fetchData };
}

/**
 * Fetch only jobs for the customer portal
 */
export function useCustomerPortalJobs(
  token: string | null,
): { jobs: PortalJob[]; loading: boolean; error: Error | null; refetch: () => void } {
  const [jobs, setJobs] = useState<PortalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError(new Error('No access token provided'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/customer-portal/jobs?token=${encodeURIComponent(token)}`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch jobs');
      }

      const data: PortalJob[] = await response.json();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { jobs, loading, error, refetch: fetchData };
}

/**
 * Fetch a single invoice by ID
 */
export function useCustomerPortalInvoiceDetail(
  token: string | null,
  invoiceId: string | null,
): UseCustomerPortalInvoiceDetailResult {
  const [invoice, setInvoice] = useState<PortalInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!token || !invoiceId) {
      setLoading(false);
      setError(new Error('No access token or invoice ID provided'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/customer-portal/invoices/${invoiceId}?token=${encodeURIComponent(token)}`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch invoice');
      }

      const data: PortalInvoice = await response.json();
      setInvoice(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [token, invoiceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { invoice, loading, error, refetch: fetchData };
}

/**
 * Fetch a single job by ID
 */
export function useCustomerPortalJobDetail(
  token: string | null,
  jobId: string | null,
): UseCustomerPortalJobDetailResult {
  const [job, setJob] = useState<PortalJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!token || !jobId) {
      setLoading(false);
      setError(new Error('No access token or job ID provided'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/customer-portal/jobs/${jobId}?token=${encodeURIComponent(token)}`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch job');
      }

      const data: PortalJob = await response.json();
      setJob(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [token, jobId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { job, loading, error, refetch: fetchData };
}

/**
 * Hook to manage job filter state
 */

import { useState, useCallback } from 'react';
import type { JobFilters } from './useFindManyJobs';
import type { JobStatus, JobPriority } from '../types/JobStatus';

export function useJobFilters() {
  const [filters, setFilters] = useState<JobFilters>({});

  const setStatus = useCallback((status: JobStatus | undefined) => {
    setFilters((prev) => ({
      ...prev,
      status,
    }));
  }, []);

  const setPriority = useCallback((priority: JobPriority | undefined) => {
    setFilters((prev) => ({
      ...prev,
      priority,
    }));
  }, []);

  const setTechnicianId = useCallback((technicianId: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      technicianId,
    }));
  }, []);

  const setCustomerId = useCallback((customerId: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      customerId,
    }));
  }, []);

  const setDateRange = useCallback((startDate?: string, endDate?: string) => {
    setFilters((prev) => ({
      ...prev,
      scheduledAt: {
        gte: startDate,
        lte: endDate,
      },
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    filters,
    setStatus,
    setPriority,
    setTechnicianId,
    setCustomerId,
    setDateRange,
    clearFilters,
  };
}

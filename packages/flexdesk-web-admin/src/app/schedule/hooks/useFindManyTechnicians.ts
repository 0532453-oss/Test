/**
 * Hook to fetch technicians for schedule resource view
 */

import {
  useFindManyRecords,
  type RecordFilter,
} from '@service-flex/core';
import type { Technician } from '@service-flex/types';

export interface TechnicianFilters extends RecordFilter {
  isActive?: boolean;
}

export interface UseFindManyTechniciansOptions {
  filter?: TechnicianFilters;
  limit?: number;
  skip?: boolean;
}

export function useFindManyTechnicians(options: UseFindManyTechniciansOptions = {}) {
  const { filter, limit = 50, skip } = options;

  const result = useFindManyRecords<Technician>({
    objectNameSingular: 'Technician',
    filter,
    limit,
    skip,
  });

  return {
    records: result.records,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

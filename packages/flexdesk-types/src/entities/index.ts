/**
 * Entity types barrel export
 */

export * from './job';
export * from './customer';
export * from './invoice';
export * from './estimate';
export * from './technician';
export * from './request';
export * from './service-provider';

// Common types
export interface ObjectRecord {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

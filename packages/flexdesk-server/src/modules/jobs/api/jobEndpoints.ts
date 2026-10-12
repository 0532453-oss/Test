/**
 * Job API Endpoints
 * 
 * Centralized endpoint definitions
 */

export const JOB_ENDPOINTS = {
  LIST: '/api/jobs',
  DETAIL: (id: string) => `/api/jobs/${id}`,
  CREATE: '/api/jobs',
  UPDATE: (id: string) => `/api/jobs/${id}`,
  UPDATE_STATUS: (id: string) => `/api/jobs/${id}/status`,
  DELETE: (id: string) => `/api/jobs/${id}`,
  SYNC: '/api/jobs/sync',
} as const;

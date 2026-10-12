/**
 * Simple Jobber Entity Types
 *
 * @deprecated Import types from @service-flex/types instead.
 * This file re-exports shared types for backwards compatibility
 * and adds UI-specific extensions (Tailwind color classes).
 */

// Re-export canonical types from shared package
export {
  // Job types
  JobStatus,
  JobPriority,
  type Job,
  jobStatusChoices,
  jobPriorityChoices,
  legacyStatusMap,
  normalizeJobStatus,

  // Customer/Client types
  ClientStatus,
  type Client,
  type Customer,
  clientStatusChoices,

  // Request types
  RequestStatus,
  type ServiceRequest as Request,
  requestStatusChoices,

  // Team member types
  TeamMemberRole,
  type TeamMember,
  type Technician,
  teamMemberRoleChoices,

  // Invoice types
  InvoiceStatus,
  type Invoice,
  type InvoiceLineItem,
  invoiceStatusChoices,

  // Service provider types
  ServiceProviderStatus,
  type ServiceProvider,
} from '@service-flex/types';

import type {
  JobStatus,
  JobPriority,
  ClientStatus,
  RequestStatus,
  InvoiceStatus,
  ServiceProviderStatus,
} from '@service-flex/types';

// Local interface for address (not in shared types yet)
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  lat?: number;
  lng?: number;
}

// =============================================================================
// UI-SPECIFIC TYPES (Tailwind CSS class mappings)
// These are frontend-specific and not in the shared types package
// =============================================================================

/**
 * Legacy JobStatus type for backwards compatibility
 * @deprecated Use JobStatus from @service-flex/types
 */
export type LegacyJobStatus =
  | 'UNSCHEDULED'
  | 'SCHEDULED'
  | 'EN_ROUTE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

// Atlantis design token classes for client status badges
export const clientStatusColors: Record<ClientStatus, string> = {
  LEAD: 'bg-[--color-informative--surface] text-[--color-informative--text]',
  ACTIVE: 'bg-[--color-success--surface] text-[--color-success--text]',
  INACTIVE: 'bg-[--color-inactive--surface] text-[--color-text--secondary]',
};

// Atlantis design token classes for request status badges
export const requestStatusColors: Record<RequestStatus, string> = {
  NEW: 'bg-[--color-informative--surface] text-[--color-informative--text]',
  CONTACTED: 'bg-[--color-warning--surface] text-[--color-warning--text]',
  QUOTED: 'bg-[--color-informative--surface] text-[--color-informative--text]',
  CONVERTED: 'bg-[--color-success--surface] text-[--color-success--text]',
  CLOSED: 'bg-[--color-inactive--surface] text-[--color-text--secondary]',
};

// Atlantis design token classes for job status badges
// Note: Includes legacy statuses for backwards compatibility
export const jobStatusColors: Record<JobStatus | 'UNSCHEDULED' | 'EN_ROUTE', string> = {
  // Canonical statuses
  SCHEDULED: 'bg-[--color-informative--surface] text-[--color-informative--text]',
  DISPATCHED: 'bg-[--color-warning--surface] text-[--color-warning--text]',
  IN_PROGRESS: 'bg-[--color-warning--surface] text-[--color-warning--text]',
  COMPLETED: 'bg-[--color-success--surface] text-[--color-success--text]',
  CANCELLED: 'bg-[--color-critical--surface] text-[--color-critical--text]',
  ON_HOLD: 'bg-[--color-informative--surface] text-[--color-informative--text]',
  // Legacy statuses (mapped to canonical)
  UNSCHEDULED: 'bg-[--color-inactive--surface] text-[--color-text--secondary]',
  EN_ROUTE: 'bg-[--color-warning--surface] text-[--color-warning--text]',
};

// Atlantis design token classes for job priority badges
export const jobPriorityColors: Record<JobPriority, string> = {
  LOW: 'bg-[--color-inactive--surface] text-[--color-text--secondary]',
  MEDIUM: 'bg-[--color-informative--surface] text-[--color-informative--text]',
  HIGH: 'bg-[--color-warning--surface] text-[--color-warning--text]',
  URGENT: 'bg-[--color-critical--surface] text-[--color-critical--text]',
};

// Atlantis design token classes for invoice status badges
// Based on Jobber's color scheme: Draft (gray), Awaiting Payment/Sent (blue), Past Due/Overdue (red), Paid (green), Bad Debt/Cancelled (dark gray)
export const invoiceStatusColors: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-[--color-inactive--surface] text-[--color-text--secondary]',
  SENT: 'bg-[--color-informative--surface] text-[--color-informative--text]',
  PAID: 'bg-[--color-success--surface] text-[--color-success--text]',
  OVERDUE: 'bg-[--color-critical--surface] text-[--color-critical--text]',
  CANCELLED: 'bg-[--color-inactive--surface] text-[--color-text--secondary]',
};

/**
 * @deprecated Use jobStatusChoices from @service-flex/types
 * This includes legacy statuses for backwards compatibility during migration
 */
export const legacyJobStatusChoices = [
  { id: 'SCHEDULED', name: 'Scheduled' },
  { id: 'DISPATCHED', name: 'Dispatched' },
  { id: 'IN_PROGRESS', name: 'In Progress' },
  { id: 'COMPLETED', name: 'Completed' },
  { id: 'CANCELLED', name: 'Cancelled' },
  { id: 'ON_HOLD', name: 'On Hold' },
  // Legacy (for display of old data)
  { id: 'UNSCHEDULED', name: 'Unscheduled (Legacy)' },
  { id: 'EN_ROUTE', name: 'En Route (Legacy)' },
];

// =============================================================================
// ATLANTIS SEMANTIC TOKEN MAPPINGS
// Maps entity statuses to Atlantis StatusLabel status prop values
// @see https://atlantis.getjobber.com/components/StatusLabel
// =============================================================================

import type { StatusLabelStatus } from './components/atlantis/StatusLabel';

/**
 * Maps client statuses to Atlantis StatusLabel semantic tokens
 * - LEAD: informative (blue) - new potential client
 * - ACTIVE: success (green) - paying client
 * - INACTIVE: inactive (gray) - dormant client
 */
export const clientStatusToSemantic: Record<ClientStatus, StatusLabelStatus> = {
  LEAD: 'informative',
  ACTIVE: 'success',
  INACTIVE: 'inactive',
};

/**
 * Maps request statuses to Atlantis StatusLabel semantic tokens
 * - NEW: informative (blue) - just received
 * - CONTACTED: warning (yellow) - in progress
 * - QUOTED: informative (blue) - quote sent
 * - CONVERTED: success (green) - became a job
 * - CLOSED: inactive (gray) - no longer active
 */
export const requestStatusToSemantic: Record<RequestStatus, StatusLabelStatus> = {
  NEW: 'informative',
  CONTACTED: 'warning',
  QUOTED: 'informative',
  CONVERTED: 'success',
  CLOSED: 'inactive',
};

/**
 * Maps job statuses to Atlantis StatusLabel semantic tokens
 * - SCHEDULED: informative (blue) - planned
 * - DISPATCHED: warning (yellow) - assigned, en route
 * - IN_PROGRESS: warning (yellow) - actively working
 * - COMPLETED: success (green) - done
 * - CANCELLED: critical (red) - cancelled
 * - ON_HOLD: warning (yellow) - paused
 * - UNSCHEDULED/EN_ROUTE: legacy statuses
 */
export const jobStatusToSemantic: Record<JobStatus | 'UNSCHEDULED' | 'EN_ROUTE', StatusLabelStatus> = {
  SCHEDULED: 'informative',
  DISPATCHED: 'warning',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'critical',
  ON_HOLD: 'warning',
  // Legacy statuses
  UNSCHEDULED: 'inactive',
  EN_ROUTE: 'warning',
};

/**
 * Maps job priorities to Atlantis StatusLabel semantic tokens
 * Following PRD US-016 requirements:
 * - LOW: inactive (gray) - info/gray variant
 * - MEDIUM: warning (yellow) - warning/yellow variant
 * - HIGH: critical (red) - error/red variant
 * - URGENT: critical (red) - highest priority, same as HIGH visually
 */
export const jobPriorityToSemantic: Record<JobPriority, StatusLabelStatus> = {
  LOW: 'inactive',
  MEDIUM: 'warning',
  HIGH: 'critical',
  URGENT: 'critical',
};

/**
 * Maps invoice statuses to Atlantis StatusLabel semantic tokens
 * - DRAFT: inactive (gray) - not sent
 * - SENT: informative (blue) - awaiting payment
 * - PAID: success (green) - completed
 * - OVERDUE: critical (red) - past due
 * - CANCELLED: inactive (gray) - voided
 */
export const invoiceStatusToSemantic: Record<InvoiceStatus, StatusLabelStatus> = {
  DRAFT: 'inactive',
  SENT: 'informative',
  PAID: 'success',
  OVERDUE: 'critical',
  CANCELLED: 'inactive',
};

/**
 * Maps service provider statuses to Atlantis StatusLabel semantic tokens
 * - ACTIVE: success (green) - active provider
 * - INACTIVE: inactive (gray) - dormant provider
 * - PENDING: warning (yellow) - awaiting approval
 * - SUSPENDED: critical (red) - suspended provider
 */
export const serviceProviderStatusToSemantic: Record<ServiceProviderStatus, StatusLabelStatus> = {
  ACTIVE: 'success',
  INACTIVE: 'inactive',
  PENDING: 'warning',
  SUSPENDED: 'critical',
};

/**
 * Helper to format status values for display (e.g., "IN_PROGRESS" → "In Progress")
 */
export function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Simple Jobber Entity Types
 *
 * Local types for the preview application that match the mock data structure.
 * These are optimized for the preview/demo environment with richer address objects
 * and simplified schemas.
 */

import type { StatusLabelStatus } from '@/atlantis/StatusLabel';

// =============================================================================
// ADDRESS TYPE
// =============================================================================

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
// CLIENT / CUSTOMER TYPES
// =============================================================================

export const ClientStatus = {
  LEAD: 'LEAD',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type ClientStatus = (typeof ClientStatus)[keyof typeof ClientStatus];

export const clientStatusChoices = [
  { id: ClientStatus.LEAD, name: 'Lead' },
  { id: ClientStatus.ACTIVE, name: 'Active' },
  { id: ClientStatus.INACTIVE, name: 'Inactive' },
];

export interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: Address;
  notes?: string | null;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
}

export type Customer = Client;

// =============================================================================
// REQUEST TYPES
// =============================================================================

export const RequestStatus = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  QUOTED: 'QUOTED',
  CONVERTED: 'CONVERTED',
  CLOSED: 'CLOSED',
} as const;

export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export const requestStatusChoices = [
  { id: RequestStatus.NEW, name: 'New' },
  { id: RequestStatus.CONTACTED, name: 'Contacted' },
  { id: RequestStatus.QUOTED, name: 'Quoted' },
  { id: RequestStatus.CONVERTED, name: 'Converted' },
  { id: RequestStatus.CLOSED, name: 'Closed' },
];

export interface Request {
  id: string;
  title: string;
  description?: string | null;
  status: RequestStatus;
  clientId: string;
  preferredDate?: string | null;
  estimatedValue?: number | null;
  source?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ServiceRequest = Request;

// =============================================================================
// JOB TYPES
// =============================================================================

export const JobStatus = {
  SCHEDULED: 'SCHEDULED',
  DISPATCHED: 'DISPATCHED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ON_HOLD: 'ON_HOLD',
} as const;

export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const jobStatusChoices = [
  { id: JobStatus.SCHEDULED, name: 'Scheduled' },
  { id: JobStatus.DISPATCHED, name: 'Dispatched' },
  { id: JobStatus.IN_PROGRESS, name: 'In Progress' },
  { id: JobStatus.COMPLETED, name: 'Completed' },
  { id: JobStatus.CANCELLED, name: 'Cancelled' },
  { id: JobStatus.ON_HOLD, name: 'On Hold' },
];

export const JobPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type JobPriority = (typeof JobPriority)[keyof typeof JobPriority];

export const jobPriorityChoices = [
  { id: JobPriority.LOW, name: 'Low' },
  { id: JobPriority.MEDIUM, name: 'Medium' },
  { id: JobPriority.HIGH, name: 'High' },
  { id: JobPriority.URGENT, name: 'Urgent' },
];

// Legacy status map for backwards compatibility
export const legacyStatusMap: Record<string, JobStatus> = {
  UNSCHEDULED: JobStatus.SCHEDULED,
  EN_ROUTE: JobStatus.DISPATCHED,
};

export function normalizeJobStatus(status: string): JobStatus {
  if (status in legacyStatusMap) {
    return legacyStatusMap[status];
  }
  return status as JobStatus;
}

export interface Job {
  id: string;
  title: string;
  description?: string | null;
  status: JobStatus | 'UNSCHEDULED' | 'EN_ROUTE';
  priority: JobPriority;
  customerId: string;
  /** @deprecated Use customerId – kept for backwards compatibility with data provider mapping */
  clientId?: string;
  requestId?: string | null;
  scheduledDate?: string | null;
  scheduledStartTime?: string | null;
  scheduledEndTime?: string | null;
  actualStartAt?: string | null;
  actualEndAt?: string | null;
  technicianId?: string | null;
  /** @deprecated Use technicianId – kept for backwards compatibility with data provider mapping */
  assignedToId?: string | null;
  estimatedDuration?: number | null;
  estimatedValue?: number | null;
  address?: Address;
  location?: { address?: string; lat?: number; lng?: number };
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// TEAM MEMBER TYPES
// =============================================================================

export const TeamMemberRole = {
  ADMIN: 'ADMIN',
  DISPATCHER: 'DISPATCHER',
  TECHNICIAN: 'TECHNICIAN',
} as const;

export type TeamMemberRole = (typeof TeamMemberRole)[keyof typeof TeamMemberRole];

export const teamMemberRoleChoices = [
  { id: TeamMemberRole.ADMIN, name: 'Admin' },
  { id: TeamMemberRole.DISPATCHER, name: 'Dispatcher' },
  { id: TeamMemberRole.TECHNICIAN, name: 'Technician' },
];

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: TeamMemberRole;
  color?: string | null;
  isActive: boolean;
  createdAt: string;
}

export type Technician = TeamMember;

// =============================================================================
// INVOICE TYPES
// =============================================================================

export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;

export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export const invoiceStatusChoices = [
  { id: InvoiceStatus.DRAFT, name: 'Draft' },
  { id: InvoiceStatus.SENT, name: 'Sent' },
  { id: InvoiceStatus.PAID, name: 'Paid' },
  { id: InvoiceStatus.OVERDUE, name: 'Overdue' },
  { id: InvoiceStatus.CANCELLED, name: 'Cancelled' },
];

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  invoiceId: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string | null;
  dueDate?: string | null;
  paidAt?: string | null;
  customerId: string;
  jobId?: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  lineItems: InvoiceLineItem[];
}

// =============================================================================
// ESTIMATE TYPES
// =============================================================================

export const EstimateStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  VIEWED: 'VIEWED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  CONVERTED: 'CONVERTED',
} as const;

export type EstimateStatus = (typeof EstimateStatus)[keyof typeof EstimateStatus];

export const estimateStatusChoices = [
  { id: EstimateStatus.DRAFT, name: 'Draft' },
  { id: EstimateStatus.SENT, name: 'Sent' },
  { id: EstimateStatus.VIEWED, name: 'Viewed' },
  { id: EstimateStatus.ACCEPTED, name: 'Accepted' },
  { id: EstimateStatus.REJECTED, name: 'Rejected' },
  { id: EstimateStatus.EXPIRED, name: 'Expired' },
  { id: EstimateStatus.CONVERTED, name: 'Converted' },
];

export interface EstimateLineItem {
  id: string;
  estimateId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  serviceType?: string | null;
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  status: EstimateStatus;
  customerId: string;
  title: string;
  description?: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  validUntil?: string | null;
  sentAt?: string | null;
  viewedAt?: string | null;
  respondedAt?: string | null;
  convertedJobId?: string | null;
  lineItems: EstimateLineItem[];
  customer?: Customer;
  convertedJob?: Job;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEstimateInput {
  customerId: string;
  title: string;
  description?: string | null;
  discount?: number;
  validUntil?: string | null;
  lineItems: Omit<EstimateLineItem, 'id' | 'estimateId'>[];
}

export interface UpdateEstimateInput {
  title?: string;
  description?: string | null;
  discount?: number;
  validUntil?: string | null;
  lineItems?: Omit<EstimateLineItem, 'id' | 'estimateId'>[];
}

// =============================================================================
// SERVICE PROVIDER TYPES
// =============================================================================

export const ServiceProviderStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
  SUSPENDED: 'SUSPENDED',
} as const;

export type ServiceProviderStatus = (typeof ServiceProviderStatus)[keyof typeof ServiceProviderStatus];

export const serviceProviderStatusChoices = [
  { id: ServiceProviderStatus.ACTIVE, name: 'Active' },
  { id: ServiceProviderStatus.INACTIVE, name: 'Inactive' },
  { id: ServiceProviderStatus.PENDING, name: 'Pending' },
  { id: ServiceProviderStatus.SUSPENDED, name: 'Suspended' },
];

export interface ServiceProvider {
  id: string;
  name: string;
  rating?: number | null;
  status: ServiceProviderStatus;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// UI-SPECIFIC TYPES (Tailwind CSS class mappings)
// =============================================================================

/**
 * Legacy JobStatus type for backwards compatibility
 * @deprecated Use JobStatus
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
  LEAD: 'bg-[var(--color-informative--surface)] text-[var(--color-informative--text)]',
  ACTIVE: 'bg-[var(--color-success--surface)] text-[var(--color-success--text)]',
  INACTIVE: 'bg-[var(--color-inactive--surface)] text-[var(--color-text--secondary)]',
};

// Atlantis design token classes for request status badges
export const requestStatusColors: Record<RequestStatus, string> = {
  NEW: 'bg-[var(--color-informative--surface)] text-[var(--color-informative--text)]',
  CONTACTED: 'bg-[var(--color-warning--surface)] text-[var(--color-warning--text)]',
  QUOTED: 'bg-[var(--color-informative--surface)] text-[var(--color-informative--text)]',
  CONVERTED: 'bg-[var(--color-success--surface)] text-[var(--color-success--text)]',
  CLOSED: 'bg-[var(--color-inactive--surface)] text-[var(--color-text--secondary)]',
};

// Atlantis design token classes for job status badges
export const jobStatusColors: Record<JobStatus | 'UNSCHEDULED' | 'EN_ROUTE', string> = {
  SCHEDULED: 'bg-[var(--color-informative--surface)] text-[var(--color-informative--text)]',
  DISPATCHED: 'bg-[var(--color-warning--surface)] text-[var(--color-warning--text)]',
  IN_PROGRESS: 'bg-[var(--color-warning--surface)] text-[var(--color-warning--text)]',
  COMPLETED: 'bg-[var(--color-success--surface)] text-[var(--color-success--text)]',
  CANCELLED: 'bg-[var(--color-critical--surface)] text-[var(--color-critical--text)]',
  ON_HOLD: 'bg-[var(--color-informative--surface)] text-[var(--color-informative--text)]',
  UNSCHEDULED: 'bg-[var(--color-inactive--surface)] text-[var(--color-text--secondary)]',
  EN_ROUTE: 'bg-[var(--color-warning--surface)] text-[var(--color-warning--text)]',
};

// Atlantis design token classes for job priority badges
export const jobPriorityColors: Record<JobPriority, string> = {
  LOW: 'bg-[var(--color-inactive--surface)] text-[var(--color-text--secondary)]',
  MEDIUM: 'bg-[var(--color-informative--surface)] text-[var(--color-informative--text)]',
  HIGH: 'bg-[var(--color-warning--surface)] text-[var(--color-warning--text)]',
  URGENT: 'bg-[var(--color-critical--surface)] text-[var(--color-critical--text)]',
};

// Atlantis design token classes for invoice status badges
export const invoiceStatusColors: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-[var(--color-inactive--surface)] text-[var(--color-text--secondary)]',
  SENT: 'bg-[var(--color-informative--surface)] text-[var(--color-informative--text)]',
  PAID: 'bg-[var(--color-success--surface)] text-[var(--color-success--text)]',
  OVERDUE: 'bg-[var(--color-critical--surface)] text-[var(--color-critical--text)]',
  CANCELLED: 'bg-[var(--color-inactive--surface)] text-[var(--color-text--secondary)]',
};

// Atlantis design token classes for estimate status badges
export const estimateStatusColors: Record<EstimateStatus, string> = {
  DRAFT: 'bg-[var(--color-inactive--surface)] text-[var(--color-text--secondary)]',
  SENT: 'bg-[var(--color-informative--surface)] text-[var(--color-informative--text)]',
  VIEWED: 'bg-[var(--color-informative--surface)] text-[var(--color-informative--text)]',
  ACCEPTED: 'bg-[var(--color-success--surface)] text-[var(--color-success--text)]',
  REJECTED: 'bg-[var(--color-critical--surface)] text-[var(--color-critical--text)]',
  EXPIRED: 'bg-[var(--color-warning--surface)] text-[var(--color-warning--text)]',
  CONVERTED: 'bg-[var(--color-success--surface)] text-[var(--color-success--text)]',
};

/**
 * @deprecated Use jobStatusChoices
 */
export const legacyJobStatusChoices = [
  { id: 'SCHEDULED', name: 'Scheduled' },
  { id: 'DISPATCHED', name: 'Dispatched' },
  { id: 'IN_PROGRESS', name: 'In Progress' },
  { id: 'COMPLETED', name: 'Completed' },
  { id: 'CANCELLED', name: 'Cancelled' },
  { id: 'ON_HOLD', name: 'On Hold' },
  { id: 'UNSCHEDULED', name: 'Unscheduled (Legacy)' },
  { id: 'EN_ROUTE', name: 'En Route (Legacy)' },
];

// =============================================================================
// ATLANTIS SEMANTIC TOKEN MAPPINGS
// =============================================================================

export const clientStatusToSemantic: Record<ClientStatus, StatusLabelStatus> = {
  LEAD: 'informative',
  ACTIVE: 'success',
  INACTIVE: 'inactive',
};

export const requestStatusToSemantic: Record<RequestStatus, StatusLabelStatus> = {
  NEW: 'informative',
  CONTACTED: 'warning',
  QUOTED: 'informative',
  CONVERTED: 'success',
  CLOSED: 'inactive',
};

export const jobStatusToSemantic: Record<JobStatus | 'UNSCHEDULED' | 'EN_ROUTE', StatusLabelStatus> = {
  SCHEDULED: 'informative',
  DISPATCHED: 'warning',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'critical',
  ON_HOLD: 'informative',
  UNSCHEDULED: 'inactive',
  EN_ROUTE: 'warning',
};

export const jobPriorityToSemantic: Record<JobPriority, StatusLabelStatus> = {
  LOW: 'inactive',
  MEDIUM: 'informative',
  HIGH: 'critical',
  URGENT: 'critical',
};

export const invoiceStatusToSemantic: Record<InvoiceStatus, StatusLabelStatus> = {
  DRAFT: 'inactive',
  SENT: 'informative',
  PAID: 'success',
  OVERDUE: 'critical',
  CANCELLED: 'inactive',
};

export const serviceProviderStatusToSemantic: Record<ServiceProviderStatus, StatusLabelStatus> = {
  ACTIVE: 'success',
  INACTIVE: 'inactive',
  PENDING: 'warning',
  SUSPENDED: 'critical',
};

export const estimateStatusToSemantic: Record<EstimateStatus, StatusLabelStatus> = {
  DRAFT: 'inactive',
  SENT: 'informative',
  VIEWED: 'informative',
  ACCEPTED: 'success',
  REJECTED: 'critical',
  EXPIRED: 'warning',
  CONVERTED: 'success',
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

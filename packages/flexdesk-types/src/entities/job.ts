/**
 * Job entity types - aligned with Prisma schema
 * Source of truth: packages/service-flex-server/prisma/schema.prisma
 */

// Canonical JobStatus values (matches Prisma enum)
export const JobStatus = {
  SCHEDULED: 'SCHEDULED',
  DISPATCHED: 'DISPATCHED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ON_HOLD: 'ON_HOLD',
} as const;

export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

// Migration mapping for deprecated frontend values
export const legacyStatusMap: Record<string, JobStatus> = {
  UNSCHEDULED: JobStatus.SCHEDULED,
  EN_ROUTE: JobStatus.DISPATCHED,
};

/**
 * Convert legacy status to canonical status
 */
export function normalizeJobStatus(status: string): JobStatus {
  if (status in legacyStatusMap) {
    return legacyStatusMap[status];
  }
  if (Object.values(JobStatus).includes(status as JobStatus)) {
    return status as JobStatus;
  }
  throw new Error(`Unknown job status: ${status}`);
}

export const JobPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type JobPriority = (typeof JobPriority)[keyof typeof JobPriority];

export const SyncStatus = {
  PENDING: 'PENDING',
  SYNCING: 'SYNCING',
  SYNCED: 'SYNCED',
  CONFLICT: 'CONFLICT',
  FAILED: 'FAILED',
} as const;

export type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus];

// UI helpers
export const jobStatusColors: Record<JobStatus, string> = {
  [JobStatus.SCHEDULED]: '#3498db',
  [JobStatus.DISPATCHED]: '#9b59b6',
  [JobStatus.IN_PROGRESS]: '#f39c12',
  [JobStatus.COMPLETED]: '#27ae60',
  [JobStatus.CANCELLED]: '#95a5a6',
  [JobStatus.ON_HOLD]: '#e74c3c',
};

export const jobStatusLabels: Record<JobStatus, string> = {
  [JobStatus.SCHEDULED]: 'Scheduled',
  [JobStatus.DISPATCHED]: 'Dispatched',
  [JobStatus.IN_PROGRESS]: 'In Progress',
  [JobStatus.COMPLETED]: 'Completed',
  [JobStatus.CANCELLED]: 'Cancelled',
  [JobStatus.ON_HOLD]: 'On Hold',
};

export const jobStatusChoices = Object.entries(jobStatusLabels).map(([id, name]) => ({
  id,
  name,
}));

export const jobPriorityColors: Record<JobPriority, string> = {
  [JobPriority.LOW]: '#95a5a6',
  [JobPriority.MEDIUM]: '#3498db',
  [JobPriority.HIGH]: '#f39c12',
  [JobPriority.URGENT]: '#e74c3c',
};

export const jobPriorityChoices = [
  { id: JobPriority.LOW, name: 'Low' },
  { id: JobPriority.MEDIUM, name: 'Medium' },
  { id: JobPriority.HIGH, name: 'High' },
  { id: JobPriority.URGENT, name: 'Urgent' },
];

// Job entity interface
export interface Job {
  id: string;
  title: string;
  description?: string | null;
  status: JobStatus;
  priority: JobPriority;
  scheduledDate?: Date | string | null;
  scheduledStartTime?: string | null;
  scheduledEndTime?: string | null;
  actualStartTime?: Date | string | null;
  actualEndTime?: Date | string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  customerId: string;
  assignedTechnicianId?: string | null;
  workspaceId: string;
  syncStatus: SyncStatus;
  localVersion: number;
  serverVersion: number;
  lastSyncedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}

export interface JobCreateInput {
  title: string;
  description?: string | null;
  status?: JobStatus;
  priority?: JobPriority;
  scheduledDate?: Date | string | null;
  scheduledStartTime?: string | null;
  scheduledEndTime?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  customerId: string;
  assignedTechnicianId?: string | null;
}

export interface JobUpdateInput extends Partial<JobCreateInput> {
  id: string;
}

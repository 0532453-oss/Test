// Job types - using canonical types from @service-flex/types
import { JobStatus, JobPriority, SyncStatus } from '@service-flex/types'
export { JobStatus, JobPriority, SyncStatus }

export interface Job {
  id: string
  workspaceId: string
  customerId: string
  technicianId?: string
  propertyId?: string
  title: string
  description?: string
  status: JobStatus
  priority: JobPriority
  scheduledAt?: string
  // New scheduling fields for calendar integration
  scheduledDate?: string // Format: YYYY-MM-DD
  scheduledStartTime?: string // Format: HH:mm
  scheduledEndTime?: string // Format: HH:mm
  startedAt?: string
  completedAt?: string
  location?: { address?: string; lat?: number; lng?: number }
  estimatedDuration?: number // minutes
  recurringTemplateId?: string
  // Sync metadata for offline support
  syncStatus: SyncStatus
  lastSyncedAt?: string
  syncVersion: number
  createdAt: string
  updatedAt: string
}

export interface JobFilters {
  status?: JobStatus
  priority?: JobPriority
  technicianId?: string
  customerId?: string
}

export interface CreateJobInput {
  customerId: string
  technicianId?: string
  assignedTechnicianId?: string
  title: string
  description?: string
  priority?: JobPriority
  scheduledAt?: string
  scheduledDate?: string // Format: YYYY-MM-DD
  scheduledStartTime?: string // Format: HH:mm
  scheduledEndTime?: string // Format: HH:mm
  estimatedDuration?: number
  location?: { address?: string; lat?: number; lng?: number }
}

export interface UpdateJobInput extends Partial<CreateJobInput> {
  status?: JobStatus
}

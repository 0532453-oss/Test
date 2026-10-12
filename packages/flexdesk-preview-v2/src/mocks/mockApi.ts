/**
 * Mock API client for demo mode - fully isolated from real API
 */
import { mockJobs, mockCustomers, mockTechnicians } from './data'
import type { Job, CreateJobInput, UpdateJobInput } from '@features/jobs/types'
import { SyncStatus, JobStatus, JobPriority } from '@service-flex/types'

interface RequestOptions {
  body?: unknown
  params?: Record<string, string | number | boolean | undefined>
}

// Internal mutable copies of mock data
let jobs = [...mockJobs]
let customers = [...mockCustomers]
let technicians = [...mockTechnicians]

// Helper to generate unique IDs
const generateId = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Helper to add artificial delay (200ms)
const delay = (ms: number = 200): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

// Helper to extract ID from path like /jobs/123
const extractIdFromPath = (path: string): string | null => {
  const match = path.match(/\/([^/]+)$/)
  return match ? match[1] : null
}

// Helper to parse endpoint and determine resource type
const parseEndpoint = (endpoint: string): { resource: string; id: string | null } => {
  const parts = endpoint.split('/').filter(Boolean)
  const resource = parts[0] || ''
  const id = parts.length > 1 ? parts[1] : null
  return { resource, id }
}

/**
 * Mock API client that mimics the real ApiClient interface
 */
export class MockApiClient {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_baseUrl?: string) {
    // baseUrl not used in mock, but matches real ApiClient signature
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    await delay()

    const { resource, id } = parseEndpoint(endpoint)

    switch (resource) {
      case 'jobs': {
        if (id) {
          const job = jobs.find(j => j.id === id)
          if (!job) {
            throw new MockApiError('Job not found', 404)
          }
          return job as T
        }
        // Filter by query params
        let filtered = [...jobs]
        if (options?.params) {
          const { status, priority, technicianId, customerId } = options.params
          if (status) {
            filtered = filtered.filter(j => j.status === status)
          }
          if (priority) {
            filtered = filtered.filter(j => j.priority === priority)
          }
          if (technicianId) {
            filtered = filtered.filter(j => j.technicianId === technicianId)
          }
          if (customerId) {
            filtered = filtered.filter(j => j.customerId === customerId)
          }
        }
        return filtered as T
      }

      case 'customers': {
        if (id) {
          const customer = customers.find(c => c.id === id)
          if (!customer) {
            throw new MockApiError('Customer not found', 404)
          }
          return customer as T
        }
        return customers as T
      }

      case 'technicians':
      case 'team-members': {
        if (id) {
          const technician = technicians.find(t => t.id === id)
          if (!technician) {
            throw new MockApiError('Technician not found', 404)
          }
          return technician as T
        }
        return technicians as T
      }

      default:
        throw new MockApiError(`Unknown resource: ${resource}`, 404)
    }
  }

  async post<T>(endpoint: string, body?: unknown, _options?: RequestOptions): Promise<T> {
    await delay()

    const { resource } = parseEndpoint(endpoint)

    switch (resource) {
      case 'jobs': {
        const input = body as CreateJobInput
        const newJob: Job = {
          id: generateId('job'),
          workspaceId: 'demo-workspace',
          customerId: input.customerId,
          technicianId: input.assignedTechnicianId || input.technicianId,
          propertyId: undefined,
          title: input.title,
          description: input.description || '',
          status: JobStatus.SCHEDULED,
          priority: input.priority || JobPriority.MEDIUM,
          scheduledAt: input.scheduledDate ? `${input.scheduledDate}T${input.scheduledStartTime || '09:00'}:00Z` : undefined,
          scheduledDate: input.scheduledDate,
          scheduledStartTime: input.scheduledStartTime,
          scheduledEndTime: input.scheduledEndTime,
          startedAt: undefined,
          completedAt: undefined,
          location: input.location,
          estimatedDuration: input.estimatedDuration,
          recurringTemplateId: undefined,
          syncStatus: SyncStatus.SYNCED,
          lastSyncedAt: new Date().toISOString(),
          syncVersion: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        jobs.push(newJob)
        return newJob as T
      }

      default:
        throw new MockApiError(`POST not implemented for: ${resource}`, 501)
    }
  }

  async put<T>(endpoint: string, body?: unknown, _options?: RequestOptions): Promise<T> {
    await delay()

    const { resource, id } = parseEndpoint(endpoint)

    switch (resource) {
      case 'jobs': {
        if (!id) {
          throw new MockApiError('Job ID required for update', 400)
        }
        const jobIndex = jobs.findIndex(j => j.id === id)
        if (jobIndex === -1) {
          throw new MockApiError('Job not found', 404)
        }
        const input = body as UpdateJobInput
        const updatedJob: Job = {
          ...jobs[jobIndex],
          ...input,
          updatedAt: new Date().toISOString(),
          syncVersion: (jobs[jobIndex].syncVersion || 0) + 1,
        }
        jobs[jobIndex] = updatedJob
        return updatedJob as T
      }

      default:
        throw new MockApiError(`PUT not implemented for: ${resource}`, 501)
    }
  }

  async patch<T>(endpoint: string, body?: unknown, _options?: RequestOptions): Promise<T> {
    // PATCH behaves same as PUT for our mock
    return this.put<T>(endpoint, body, _options)
  }

  async delete<T>(endpoint: string, _options?: RequestOptions): Promise<T> {
    await delay()

    const { resource, id } = parseEndpoint(endpoint)

    switch (resource) {
      case 'jobs': {
        if (!id) {
          throw new MockApiError('Job ID required for delete', 400)
        }
        const jobIndex = jobs.findIndex(j => j.id === id)
        if (jobIndex === -1) {
          throw new MockApiError('Job not found', 404)
        }
        jobs.splice(jobIndex, 1)
        return undefined as T
      }

      default:
        throw new MockApiError(`DELETE not implemented for: ${resource}`, 501)
    }
  }

  /**
   * Reset mock data to original state (useful for testing)
   */
  static resetData(): void {
    jobs = [...mockJobs]
    customers = [...mockCustomers]
    technicians = [...mockTechnicians]
  }
}

/**
 * Mock API error matching real ApiError structure
 */
export class MockApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError' // Match real ApiError name for consistent error handling
  }
}

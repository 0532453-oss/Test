/**
 * Mock data for demo mode - isolated from real API
 */
import {
  JobStatus,
  JobPriority,
  SyncStatus,
  type Customer,
  ClientStatus,
  type Technician,
  TeamMemberRole,
} from '@service-flex/types'
import type { Job } from '@features/jobs/types'

// User type matching AuthProvider
export interface User {
  id: string
  email: string
  fullName: string
  role: string
  workspaceId: string
  avatarUrl?: string
}

// Demo workspace ID used for all mock data
const DEMO_WORKSPACE_ID = 'demo-workspace'

/**
 * Mock user for demo login
 */
export const mockUser: User = {
  id: 'demo-user',
  email: 'demo@flexdesk.com',
  fullName: 'Demo User',
  role: 'ADMIN',
  workspaceId: DEMO_WORKSPACE_ID,
}

/**
 * Mock technicians (2 sample technicians)
 */
export const mockTechnicians: Technician[] = [
  {
    id: 'tech-1',
    userId: 'user-tech-1',
    name: 'John Smith',
    email: 'john.smith@flexdesk.com',
    phone: '+1 (555) 123-4567',
    role: TeamMemberRole.TECHNICIAN,
    isActive: true,
    color: '#3498db',
    avatarUrl: null,
    workspaceId: DEMO_WORKSPACE_ID,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    deletedAt: null,
  },
  {
    id: 'tech-2',
    userId: 'user-tech-2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@flexdesk.com',
    phone: '+1 (555) 987-6543',
    role: TeamMemberRole.TECHNICIAN,
    isActive: true,
    color: '#9b59b6',
    avatarUrl: null,
    workspaceId: DEMO_WORKSPACE_ID,
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-01T09:00:00Z',
    deletedAt: null,
  },
]

/**
 * Mock customers (3 sample customers)
 */
export const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1 (555) 111-2222',
    address: '123 Business Ave',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    latitude: 37.7749,
    longitude: -122.4194,
    notes: 'Long-term commercial client',
    status: ClientStatus.ACTIVE,
    workspaceId: DEMO_WORKSPACE_ID,
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-10T08:00:00Z',
    deletedAt: null,
  },
  {
    id: 'cust-2',
    name: 'Green Valley Apartments',
    email: 'manager@greenvalley.com',
    phone: '+1 (555) 333-4444',
    address: '456 Residential Blvd',
    city: 'Oakland',
    state: 'CA',
    zipCode: '94612',
    latitude: 37.8044,
    longitude: -122.2712,
    notes: 'Property management company - multiple units',
    status: ClientStatus.ACTIVE,
    workspaceId: DEMO_WORKSPACE_ID,
    createdAt: '2024-01-20T14:00:00Z',
    updatedAt: '2024-01-20T14:00:00Z',
    deletedAt: null,
  },
  {
    id: 'cust-3',
    name: 'Downtown Bistro',
    email: 'owner@downtownbistro.com',
    phone: '+1 (555) 555-6666',
    address: '789 Main Street',
    city: 'Berkeley',
    state: 'CA',
    zipCode: '94704',
    latitude: 37.8716,
    longitude: -122.2727,
    notes: null,
    status: ClientStatus.LEAD,
    workspaceId: DEMO_WORKSPACE_ID,
    createdAt: '2024-03-01T11:00:00Z',
    updatedAt: '2024-03-01T11:00:00Z',
    deletedAt: null,
  },
]

/**
 * Mock jobs (5 sample jobs with various statuses/priorities)
 */
export const mockJobs: Job[] = [
  {
    id: 'job-1',
    workspaceId: DEMO_WORKSPACE_ID,
    customerId: 'cust-1',
    technicianId: 'tech-1',
    propertyId: undefined,
    title: 'HVAC Maintenance',
    description: 'Quarterly HVAC system inspection and filter replacement',
    status: JobStatus.SCHEDULED,
    priority: JobPriority.MEDIUM,
    scheduledAt: '2024-03-15T09:00:00Z',
    scheduledDate: '2024-03-15',
    scheduledStartTime: '09:00',
    scheduledEndTime: '11:00',
    startedAt: undefined,
    completedAt: undefined,
    location: {
      address: '123 Business Ave, San Francisco, CA 94102',
      lat: 37.7749,
      lng: -122.4194,
    },
    estimatedDuration: 120,
    recurringTemplateId: undefined,
    syncStatus: SyncStatus.SYNCED,
    lastSyncedAt: '2024-03-10T12:00:00Z',
    syncVersion: 1,
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-10T12:00:00Z',
  },
  {
    id: 'job-2',
    workspaceId: DEMO_WORKSPACE_ID,
    customerId: 'cust-2',
    technicianId: 'tech-2',
    propertyId: undefined,
    title: 'Emergency Plumbing Repair',
    description: 'Water leak in unit 204 - tenant reported flooding',
    status: JobStatus.IN_PROGRESS,
    priority: JobPriority.URGENT,
    scheduledAt: '2024-03-12T14:00:00Z',
    scheduledDate: '2024-03-12',
    scheduledStartTime: '14:00',
    scheduledEndTime: '17:00',
    startedAt: '2024-03-12T14:15:00Z',
    completedAt: undefined,
    location: {
      address: '456 Residential Blvd, Unit 204, Oakland, CA 94612',
      lat: 37.8044,
      lng: -122.2712,
    },
    estimatedDuration: 180,
    recurringTemplateId: undefined,
    syncStatus: SyncStatus.SYNCED,
    lastSyncedAt: '2024-03-12T14:15:00Z',
    syncVersion: 2,
    createdAt: '2024-03-12T13:00:00Z',
    updatedAt: '2024-03-12T14:15:00Z',
  },
  {
    id: 'job-3',
    workspaceId: DEMO_WORKSPACE_ID,
    customerId: 'cust-1',
    technicianId: 'tech-1',
    propertyId: undefined,
    title: 'Electrical Panel Upgrade',
    description: 'Upgrade main electrical panel from 100A to 200A',
    status: JobStatus.COMPLETED,
    priority: JobPriority.HIGH,
    scheduledAt: '2024-03-08T08:00:00Z',
    scheduledDate: '2024-03-08',
    scheduledStartTime: '08:00',
    scheduledEndTime: '16:00',
    startedAt: '2024-03-08T08:30:00Z',
    completedAt: '2024-03-08T15:45:00Z',
    location: {
      address: '123 Business Ave, San Francisco, CA 94102',
      lat: 37.7749,
      lng: -122.4194,
    },
    estimatedDuration: 480,
    recurringTemplateId: undefined,
    syncStatus: SyncStatus.SYNCED,
    lastSyncedAt: '2024-03-08T15:45:00Z',
    syncVersion: 3,
    createdAt: '2024-02-20T09:00:00Z',
    updatedAt: '2024-03-08T15:45:00Z',
  },
  {
    id: 'job-4',
    workspaceId: DEMO_WORKSPACE_ID,
    customerId: 'cust-3',
    technicianId: undefined,
    propertyId: undefined,
    title: 'Kitchen Equipment Installation',
    description: 'Install new commercial refrigeration unit',
    status: JobStatus.ON_HOLD,
    priority: JobPriority.LOW,
    scheduledAt: undefined,
    scheduledDate: undefined,
    scheduledStartTime: undefined,
    scheduledEndTime: undefined,
    startedAt: undefined,
    completedAt: undefined,
    location: {
      address: '789 Main Street, Berkeley, CA 94704',
      lat: 37.8716,
      lng: -122.2727,
    },
    estimatedDuration: 240,
    recurringTemplateId: undefined,
    syncStatus: SyncStatus.SYNCED,
    lastSyncedAt: '2024-03-05T10:00:00Z',
    syncVersion: 1,
    createdAt: '2024-03-01T16:00:00Z',
    updatedAt: '2024-03-05T10:00:00Z',
  },
  {
    id: 'job-5',
    workspaceId: DEMO_WORKSPACE_ID,
    customerId: 'cust-2',
    technicianId: 'tech-2',
    propertyId: undefined,
    title: 'Fire Alarm Inspection',
    description: 'Annual fire alarm system inspection for all units',
    status: JobStatus.DISPATCHED,
    priority: JobPriority.MEDIUM,
    scheduledAt: '2024-03-14T10:00:00Z',
    scheduledDate: '2024-03-14',
    scheduledStartTime: '10:00',
    scheduledEndTime: '14:00',
    startedAt: undefined,
    completedAt: undefined,
    location: {
      address: '456 Residential Blvd, Oakland, CA 94612',
      lat: 37.8044,
      lng: -122.2712,
    },
    estimatedDuration: 240,
    recurringTemplateId: undefined,
    syncStatus: SyncStatus.SYNCED,
    lastSyncedAt: '2024-03-13T09:00:00Z',
    syncVersion: 2,
    createdAt: '2024-02-28T11:00:00Z',
    updatedAt: '2024-03-13T09:00:00Z',
  },
]

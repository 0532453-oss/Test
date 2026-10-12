import { type JobStatus, type JobPriority } from './JobStatus';
import { type BaseObjectRecord } from '@/modules/object-record/types/BaseObjectRecord';
export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'CONFLICT' | 'FAILED';
export interface JobLocation {
    address?: string;
    lat: number;
    lng: number;
}
export interface Job extends BaseObjectRecord {
    customerId: string;
    technicianId?: string | null;
    title: string;
    description?: string | null;
    status: JobStatus;
    priority: JobPriority;
    scheduledAt?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
    location?: JobLocation | null;
    estimatedDuration?: number | null;
}

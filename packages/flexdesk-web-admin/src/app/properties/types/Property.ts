export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'CONFLICT' | 'FAILED';

export interface PropertyCustomer {
  id: string;
  name: string;
}

export interface Property {
  id: string;
  workspaceId: string;
  customerId: string;
  name: string;
  isPrimary: boolean;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  lat?: number;
  lng?: number;
  accessNotes?: string;
  serviceNotes?: string;
  syncStatus: SyncStatus;
  syncVersion: number;
  createdAt: string;
  updatedAt: string;
  customer?: PropertyCustomer;
}

export interface PropertyWithRelations extends Property {
  customer: PropertyCustomer;
  jobs: {
    id: string;
    title: string;
    status: string;
    scheduledAt?: string;
  }[];
}

export interface CreatePropertyInput {
  customerId: string;
  name: string;
  isPrimary?: boolean;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  lat?: number;
  lng?: number;
  accessNotes?: string;
  serviceNotes?: string;
}

export interface UpdatePropertyInput {
  name?: string;
  isPrimary?: boolean;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  lat?: number;
  lng?: number;
  accessNotes?: string;
  serviceNotes?: string;
}

/**
 * ServiceProvider entity types - aligned with Prisma schema
 */

export const ServiceProviderStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
  SUSPENDED: 'SUSPENDED',
} as const;

export type ServiceProviderStatus = (typeof ServiceProviderStatus)[keyof typeof ServiceProviderStatus];

export const serviceProviderStatusColors: Record<ServiceProviderStatus, string> = {
  [ServiceProviderStatus.ACTIVE]: '#27ae60',
  [ServiceProviderStatus.INACTIVE]: '#95a5a6',
  [ServiceProviderStatus.PENDING]: '#f39c12',
  [ServiceProviderStatus.SUSPENDED]: '#e74c3c',
};

export const serviceProviderStatusChoices = [
  { id: ServiceProviderStatus.ACTIVE, name: 'Active' },
  { id: ServiceProviderStatus.INACTIVE, name: 'Inactive' },
  { id: ServiceProviderStatus.PENDING, name: 'Pending' },
  { id: ServiceProviderStatus.SUSPENDED, name: 'Suspended' },
];

export interface ServiceProviderContact {
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
}

export interface ServiceProvider {
  id: string;
  name: string;
  rating: number;
  status: ServiceProviderStatus;
  contact: ServiceProviderContact;
  description?: string | null;
  workspaceId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}

export interface ServiceProviderCreateInput {
  name: string;
  rating?: number;
  status?: ServiceProviderStatus;
  contact?: ServiceProviderContact;
  description?: string | null;
}

export interface ServiceProviderUpdateInput extends Partial<ServiceProviderCreateInput> {
  id: string;
}

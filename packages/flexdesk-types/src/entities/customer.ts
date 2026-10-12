/**
 * Customer entity types - aligned with Prisma schema
 */

export const ClientStatus = {
  LEAD: 'LEAD',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type ClientStatus = (typeof ClientStatus)[keyof typeof ClientStatus];

export const clientStatusColors: Record<ClientStatus, string> = {
  [ClientStatus.LEAD]: '#f39c12',
  [ClientStatus.ACTIVE]: '#27ae60',
  [ClientStatus.INACTIVE]: '#95a5a6',
};

export const clientStatusChoices = [
  { id: ClientStatus.LEAD, name: 'Lead' },
  { id: ClientStatus.ACTIVE, name: 'Active' },
  { id: ClientStatus.INACTIVE, name: 'Inactive' },
];

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  status: ClientStatus;
  workspaceId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}

export interface CustomerCreateInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  status?: ClientStatus;
}

export interface CustomerUpdateInput extends Partial<CustomerCreateInput> {
  id: string;
}

// Alias for backwards compatibility with frontend naming
export type Client = Customer;
export type ClientCreateInput = CustomerCreateInput;
export type ClientUpdateInput = CustomerUpdateInput;

/**
 * Service Request entity types - aligned with Prisma schema
 */

export const RequestStatus = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  QUOTED: 'QUOTED',
  CONVERTED: 'CONVERTED',
  CLOSED: 'CLOSED',
} as const;

export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export const requestStatusColors: Record<RequestStatus, string> = {
  [RequestStatus.NEW]: '#3498db',
  [RequestStatus.CONTACTED]: '#9b59b6',
  [RequestStatus.QUOTED]: '#f39c12',
  [RequestStatus.CONVERTED]: '#27ae60',
  [RequestStatus.CLOSED]: '#95a5a6',
};

export const requestStatusChoices = [
  { id: RequestStatus.NEW, name: 'New' },
  { id: RequestStatus.CONTACTED, name: 'Contacted' },
  { id: RequestStatus.QUOTED, name: 'Quoted' },
  { id: RequestStatus.CONVERTED, name: 'Converted' },
  { id: RequestStatus.CLOSED, name: 'Closed' },
];

export interface ServiceRequest {
  id: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  address?: string | null;
  description: string;
  status: RequestStatus;
  source?: string | null;
  notes?: string | null;
  customerId?: string | null;
  jobId?: string | null;
  workspaceId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}

export interface ServiceRequestCreateInput {
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  address?: string | null;
  description: string;
  status?: RequestStatus;
  source?: string | null;
  notes?: string | null;
  customerId?: string | null;
}

export interface ServiceRequestUpdateInput extends Partial<ServiceRequestCreateInput> {
  id: string;
}

// Alias for backwards compatibility
export type Request = ServiceRequest;
export type RequestCreateInput = ServiceRequestCreateInput;
export type RequestUpdateInput = ServiceRequestUpdateInput;

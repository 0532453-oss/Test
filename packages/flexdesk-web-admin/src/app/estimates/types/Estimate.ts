export type EstimateStatus =
  | 'DRAFT'
  | 'SENT'
  | 'VIEWED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CONVERTED';

export type JobPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface EstimateLineItem {
  id: string;
  estimateId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  serviceType?: string;
}

export interface EstimateLocation {
  address: string;
  lat?: number;
  lng?: number;
}

export interface EstimateCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface Estimate {
  id: string;
  workspaceId: string;
  customerId: string;
  estimateNumber: string;
  status: EstimateStatus;
  title: string;
  description?: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  validUntil?: string;
  sentAt?: string;
  viewedAt?: string;
  respondedAt?: string;
  estimatedDuration?: number;
  location?: EstimateLocation;
  priority: JobPriority;
  convertedJobId?: string;
  notes?: string;
  customerNotes?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
  customer?: EstimateCustomer;
  lineItems: EstimateLineItem[];
}

export interface CreateEstimateInput {
  customerId: string;
  title: string;
  description?: string;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    serviceType?: string;
  }[];
  discount?: number;
  taxRate?: number;
  validUntil?: string;
  estimatedDuration?: number;
  location?: EstimateLocation;
  priority?: JobPriority;
  customerNotes?: string;
  notes?: string;
  terms?: string;
}

export interface UpdateEstimateInput {
  title?: string;
  description?: string;
  lineItems?: {
    description: string;
    quantity: number;
    unitPrice: number;
    serviceType?: string;
  }[];
  discount?: number;
  taxRate?: number;
  validUntil?: string;
  estimatedDuration?: number;
  location?: EstimateLocation;
  priority?: JobPriority;
  customerNotes?: string;
  notes?: string;
  terms?: string;
}

export interface ConvertToJobInput {
  technicianId?: string;
  scheduledAt?: string;
}

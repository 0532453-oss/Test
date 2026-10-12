/**
 * Estimate entity types - aligned with Prisma schema
 */

export const EstimateStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  VIEWED: 'VIEWED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  CONVERTED: 'CONVERTED',
} as const;

export type EstimateStatus = (typeof EstimateStatus)[keyof typeof EstimateStatus];

export const estimateStatusColors: Record<EstimateStatus, string> = {
  [EstimateStatus.DRAFT]: '#95a5a6',
  [EstimateStatus.SENT]: '#3498db',
  [EstimateStatus.VIEWED]: '#9b59b6',
  [EstimateStatus.ACCEPTED]: '#27ae60',
  [EstimateStatus.REJECTED]: '#e74c3c',
  [EstimateStatus.EXPIRED]: '#7f8c8d',
  [EstimateStatus.CONVERTED]: '#2ecc71',
};

export const estimateStatusChoices = [
  { id: EstimateStatus.DRAFT, name: 'Draft' },
  { id: EstimateStatus.SENT, name: 'Sent' },
  { id: EstimateStatus.VIEWED, name: 'Viewed' },
  { id: EstimateStatus.ACCEPTED, name: 'Accepted' },
  { id: EstimateStatus.REJECTED, name: 'Rejected' },
  { id: EstimateStatus.EXPIRED, name: 'Expired' },
  { id: EstimateStatus.CONVERTED, name: 'Converted' },
];

export interface EstimateLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  estimateId: string;
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  status: EstimateStatus;
  subtotal: number;
  taxRate?: number | null;
  taxAmount?: number | null;
  total: number;
  notes?: string | null;
  validUntil?: Date | string | null;
  acceptedAt?: Date | string | null;
  customerId: string;
  jobId?: string | null;
  workspaceId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
  lineItems?: EstimateLineItem[];
}

export interface EstimateCreateInput {
  estimateNumber?: string;
  status?: EstimateStatus;
  subtotal: number;
  taxRate?: number | null;
  taxAmount?: number | null;
  total: number;
  notes?: string | null;
  validUntil?: Date | string | null;
  customerId: string;
  jobId?: string | null;
  lineItems?: Omit<EstimateLineItem, 'id' | 'estimateId'>[];
}

export interface EstimateUpdateInput extends Partial<EstimateCreateInput> {
  id: string;
}

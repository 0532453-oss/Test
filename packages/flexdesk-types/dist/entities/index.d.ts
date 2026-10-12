/**
 * Job entity types - aligned with Prisma schema
 * Source of truth: packages/service-flex-server/prisma/schema.prisma
 */
declare const JobStatus: {
    readonly SCHEDULED: "SCHEDULED";
    readonly DISPATCHED: "DISPATCHED";
    readonly IN_PROGRESS: "IN_PROGRESS";
    readonly COMPLETED: "COMPLETED";
    readonly CANCELLED: "CANCELLED";
    readonly ON_HOLD: "ON_HOLD";
};
type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];
declare const legacyStatusMap: Record<string, JobStatus>;
/**
 * Convert legacy status to canonical status
 */
declare function normalizeJobStatus(status: string): JobStatus;
declare const JobPriority: {
    readonly LOW: "LOW";
    readonly MEDIUM: "MEDIUM";
    readonly HIGH: "HIGH";
    readonly URGENT: "URGENT";
};
type JobPriority = (typeof JobPriority)[keyof typeof JobPriority];
declare const SyncStatus: {
    readonly PENDING: "PENDING";
    readonly SYNCING: "SYNCING";
    readonly SYNCED: "SYNCED";
    readonly CONFLICT: "CONFLICT";
    readonly FAILED: "FAILED";
};
type SyncStatus = (typeof SyncStatus)[keyof typeof SyncStatus];
declare const jobStatusColors: Record<JobStatus, string>;
declare const jobStatusLabels: Record<JobStatus, string>;
declare const jobStatusChoices: {
    id: string;
    name: string;
}[];
declare const jobPriorityColors: Record<JobPriority, string>;
declare const jobPriorityChoices: ({
    id: "LOW";
    name: string;
} | {
    id: "MEDIUM";
    name: string;
} | {
    id: "HIGH";
    name: string;
} | {
    id: "URGENT";
    name: string;
})[];
interface Job {
    id: string;
    title: string;
    description?: string | null;
    status: JobStatus;
    priority: JobPriority;
    scheduledDate?: Date | string | null;
    scheduledStartTime?: string | null;
    scheduledEndTime?: string | null;
    actualStartTime?: Date | string | null;
    actualEndTime?: Date | string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    notes?: string | null;
    customerId: string;
    assignedTechnicianId?: string | null;
    workspaceId: string;
    syncStatus: SyncStatus;
    localVersion: number;
    serverVersion: number;
    lastSyncedAt?: Date | string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    deletedAt?: Date | string | null;
}
interface JobCreateInput {
    title: string;
    description?: string | null;
    status?: JobStatus;
    priority?: JobPriority;
    scheduledDate?: Date | string | null;
    scheduledStartTime?: string | null;
    scheduledEndTime?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    notes?: string | null;
    customerId: string;
    assignedTechnicianId?: string | null;
}
interface JobUpdateInput extends Partial<JobCreateInput> {
    id: string;
}

/**
 * Customer entity types - aligned with Prisma schema
 */
declare const ClientStatus: {
    readonly LEAD: "LEAD";
    readonly ACTIVE: "ACTIVE";
    readonly INACTIVE: "INACTIVE";
};
type ClientStatus = (typeof ClientStatus)[keyof typeof ClientStatus];
declare const clientStatusColors: Record<ClientStatus, string>;
declare const clientStatusChoices: ({
    id: "LEAD";
    name: string;
} | {
    id: "ACTIVE";
    name: string;
} | {
    id: "INACTIVE";
    name: string;
})[];
interface Customer {
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
interface CustomerCreateInput {
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
interface CustomerUpdateInput extends Partial<CustomerCreateInput> {
    id: string;
}
type Client = Customer;
type ClientCreateInput = CustomerCreateInput;
type ClientUpdateInput = CustomerUpdateInput;

/**
 * Invoice entity types - aligned with Prisma schema
 */
declare const InvoiceStatus: {
    readonly DRAFT: "DRAFT";
    readonly SENT: "SENT";
    readonly PAID: "PAID";
    readonly OVERDUE: "OVERDUE";
    readonly CANCELLED: "CANCELLED";
};
type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];
declare const invoiceStatusColors: Record<InvoiceStatus, string>;
declare const invoiceStatusChoices: ({
    id: "DRAFT";
    name: string;
} | {
    id: "SENT";
    name: string;
} | {
    id: "PAID";
    name: string;
} | {
    id: "OVERDUE";
    name: string;
} | {
    id: "CANCELLED";
    name: string;
})[];
interface InvoiceLineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    invoiceId: string;
}
interface Invoice {
    id: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    subtotal: number;
    taxRate?: number | null;
    taxAmount?: number | null;
    total: number;
    notes?: string | null;
    dueDate?: Date | string | null;
    paidAt?: Date | string | null;
    customerId: string;
    jobId?: string | null;
    workspaceId: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    deletedAt?: Date | string | null;
    lineItems?: InvoiceLineItem[];
}
interface InvoiceCreateInput {
    invoiceNumber?: string;
    status?: InvoiceStatus;
    subtotal: number;
    taxRate?: number | null;
    taxAmount?: number | null;
    total: number;
    notes?: string | null;
    dueDate?: Date | string | null;
    customerId: string;
    jobId?: string | null;
    lineItems?: Omit<InvoiceLineItem, 'id' | 'invoiceId'>[];
}
interface InvoiceUpdateInput extends Partial<InvoiceCreateInput> {
    id: string;
}

/**
 * Estimate entity types - aligned with Prisma schema
 */
declare const EstimateStatus: {
    readonly DRAFT: "DRAFT";
    readonly SENT: "SENT";
    readonly VIEWED: "VIEWED";
    readonly ACCEPTED: "ACCEPTED";
    readonly REJECTED: "REJECTED";
    readonly EXPIRED: "EXPIRED";
    readonly CONVERTED: "CONVERTED";
};
type EstimateStatus = (typeof EstimateStatus)[keyof typeof EstimateStatus];
declare const estimateStatusColors: Record<EstimateStatus, string>;
declare const estimateStatusChoices: ({
    id: "DRAFT";
    name: string;
} | {
    id: "SENT";
    name: string;
} | {
    id: "VIEWED";
    name: string;
} | {
    id: "ACCEPTED";
    name: string;
} | {
    id: "REJECTED";
    name: string;
} | {
    id: "EXPIRED";
    name: string;
} | {
    id: "CONVERTED";
    name: string;
})[];
interface EstimateLineItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    estimateId: string;
}
interface Estimate {
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
interface EstimateCreateInput {
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
interface EstimateUpdateInput extends Partial<EstimateCreateInput> {
    id: string;
}

/**
 * Technician/Team Member entity types - aligned with Prisma schema
 */
declare const TeamMemberRole: {
    readonly ADMIN: "ADMIN";
    readonly TECHNICIAN: "TECHNICIAN";
    readonly DISPATCHER: "DISPATCHER";
};
type TeamMemberRole = (typeof TeamMemberRole)[keyof typeof TeamMemberRole];
declare const teamMemberRoleColors: Record<TeamMemberRole, string>;
declare const teamMemberRoleChoices: ({
    id: "ADMIN";
    name: string;
} | {
    id: "TECHNICIAN";
    name: string;
} | {
    id: "DISPATCHER";
    name: string;
})[];
interface Technician {
    id: string;
    userId: string;
    name: string;
    email: string;
    phone?: string | null;
    role: TeamMemberRole;
    isActive: boolean;
    color?: string | null;
    avatarUrl?: string | null;
    workspaceId: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    deletedAt?: Date | string | null;
}
interface TechnicianCreateInput {
    userId: string;
    name: string;
    email: string;
    phone?: string | null;
    role?: TeamMemberRole;
    isActive?: boolean;
    color?: string | null;
    avatarUrl?: string | null;
}
interface TechnicianUpdateInput extends Partial<TechnicianCreateInput> {
    id: string;
}
type TeamMember = Technician;
type TeamMemberCreateInput = TechnicianCreateInput;
type TeamMemberUpdateInput = TechnicianUpdateInput;

/**
 * Service Request entity types - aligned with Prisma schema
 */
declare const RequestStatus: {
    readonly NEW: "NEW";
    readonly CONTACTED: "CONTACTED";
    readonly QUOTED: "QUOTED";
    readonly CONVERTED: "CONVERTED";
    readonly CLOSED: "CLOSED";
};
type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];
declare const requestStatusColors: Record<RequestStatus, string>;
declare const requestStatusChoices: ({
    id: "NEW";
    name: string;
} | {
    id: "CONTACTED";
    name: string;
} | {
    id: "QUOTED";
    name: string;
} | {
    id: "CONVERTED";
    name: string;
} | {
    id: "CLOSED";
    name: string;
})[];
interface ServiceRequest {
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
interface ServiceRequestCreateInput {
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
interface ServiceRequestUpdateInput extends Partial<ServiceRequestCreateInput> {
    id: string;
}
type Request = ServiceRequest;
type RequestCreateInput = ServiceRequestCreateInput;
type RequestUpdateInput = ServiceRequestUpdateInput;

/**
 * ServiceProvider entity types - aligned with Prisma schema
 */
declare const ServiceProviderStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly INACTIVE: "INACTIVE";
    readonly PENDING: "PENDING";
    readonly SUSPENDED: "SUSPENDED";
};
type ServiceProviderStatus = (typeof ServiceProviderStatus)[keyof typeof ServiceProviderStatus];
declare const serviceProviderStatusColors: Record<ServiceProviderStatus, string>;
declare const serviceProviderStatusChoices: ({
    id: "ACTIVE";
    name: string;
} | {
    id: "INACTIVE";
    name: string;
} | {
    id: "PENDING";
    name: string;
} | {
    id: "SUSPENDED";
    name: string;
})[];
interface ServiceProviderContact {
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
}
interface ServiceProvider {
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
interface ServiceProviderCreateInput {
    name: string;
    rating?: number;
    status?: ServiceProviderStatus;
    contact?: ServiceProviderContact;
    description?: string | null;
}
interface ServiceProviderUpdateInput extends Partial<ServiceProviderCreateInput> {
    id: string;
}

/**
 * Entity types barrel export
 */

interface ObjectRecord {
    id: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    deletedAt?: Date | string | null;
}
interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
}

export { type ApiResponse, type Client, type ClientCreateInput, ClientStatus, type ClientUpdateInput, type Customer, type CustomerCreateInput, type CustomerUpdateInput, type Estimate, type EstimateCreateInput, type EstimateLineItem, EstimateStatus, type EstimateUpdateInput, type Invoice, type InvoiceCreateInput, type InvoiceLineItem, InvoiceStatus, type InvoiceUpdateInput, type Job, type JobCreateInput, JobPriority, JobStatus, type JobUpdateInput, type ObjectRecord, type PaginatedResponse, type Request, type RequestCreateInput, RequestStatus, type RequestUpdateInput, type ServiceProvider, type ServiceProviderContact, type ServiceProviderCreateInput, ServiceProviderStatus, type ServiceProviderUpdateInput, type ServiceRequest, type ServiceRequestCreateInput, type ServiceRequestUpdateInput, SyncStatus, type TeamMember, type TeamMemberCreateInput, TeamMemberRole, type TeamMemberUpdateInput, type Technician, type TechnicianCreateInput, type TechnicianUpdateInput, clientStatusChoices, clientStatusColors, estimateStatusChoices, estimateStatusColors, invoiceStatusChoices, invoiceStatusColors, jobPriorityChoices, jobPriorityColors, jobStatusChoices, jobStatusColors, jobStatusLabels, legacyStatusMap, normalizeJobStatus, requestStatusChoices, requestStatusColors, serviceProviderStatusChoices, serviceProviderStatusColors, teamMemberRoleChoices, teamMemberRoleColors };

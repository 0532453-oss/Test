// src/entities/job.ts
var JobStatus = {
  SCHEDULED: "SCHEDULED",
  DISPATCHED: "DISPATCHED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  ON_HOLD: "ON_HOLD"
};
var legacyStatusMap = {
  UNSCHEDULED: JobStatus.SCHEDULED,
  EN_ROUTE: JobStatus.DISPATCHED
};
function normalizeJobStatus(status) {
  if (status in legacyStatusMap) {
    return legacyStatusMap[status];
  }
  if (Object.values(JobStatus).includes(status)) {
    return status;
  }
  throw new Error(`Unknown job status: ${status}`);
}
var JobPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT"
};
var SyncStatus = {
  PENDING: "PENDING",
  SYNCING: "SYNCING",
  SYNCED: "SYNCED",
  CONFLICT: "CONFLICT",
  FAILED: "FAILED"
};
var jobStatusColors = {
  [JobStatus.SCHEDULED]: "#3498db",
  [JobStatus.DISPATCHED]: "#9b59b6",
  [JobStatus.IN_PROGRESS]: "#f39c12",
  [JobStatus.COMPLETED]: "#27ae60",
  [JobStatus.CANCELLED]: "#95a5a6",
  [JobStatus.ON_HOLD]: "#e74c3c"
};
var jobStatusLabels = {
  [JobStatus.SCHEDULED]: "Scheduled",
  [JobStatus.DISPATCHED]: "Dispatched",
  [JobStatus.IN_PROGRESS]: "In Progress",
  [JobStatus.COMPLETED]: "Completed",
  [JobStatus.CANCELLED]: "Cancelled",
  [JobStatus.ON_HOLD]: "On Hold"
};
var jobStatusChoices = Object.entries(jobStatusLabels).map(([id, name]) => ({
  id,
  name
}));
var jobPriorityColors = {
  [JobPriority.LOW]: "#95a5a6",
  [JobPriority.MEDIUM]: "#3498db",
  [JobPriority.HIGH]: "#f39c12",
  [JobPriority.URGENT]: "#e74c3c"
};
var jobPriorityChoices = [
  { id: JobPriority.LOW, name: "Low" },
  { id: JobPriority.MEDIUM, name: "Medium" },
  { id: JobPriority.HIGH, name: "High" },
  { id: JobPriority.URGENT, name: "Urgent" }
];

// src/entities/customer.ts
var ClientStatus = {
  LEAD: "LEAD",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE"
};
var clientStatusColors = {
  [ClientStatus.LEAD]: "#f39c12",
  [ClientStatus.ACTIVE]: "#27ae60",
  [ClientStatus.INACTIVE]: "#95a5a6"
};
var clientStatusChoices = [
  { id: ClientStatus.LEAD, name: "Lead" },
  { id: ClientStatus.ACTIVE, name: "Active" },
  { id: ClientStatus.INACTIVE, name: "Inactive" }
];

// src/entities/invoice.ts
var InvoiceStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  CANCELLED: "CANCELLED"
};
var invoiceStatusColors = {
  [InvoiceStatus.DRAFT]: "#95a5a6",
  [InvoiceStatus.SENT]: "#3498db",
  [InvoiceStatus.PAID]: "#27ae60",
  [InvoiceStatus.OVERDUE]: "#e74c3c",
  [InvoiceStatus.CANCELLED]: "#7f8c8d"
};
var invoiceStatusChoices = [
  { id: InvoiceStatus.DRAFT, name: "Draft" },
  { id: InvoiceStatus.SENT, name: "Sent" },
  { id: InvoiceStatus.PAID, name: "Paid" },
  { id: InvoiceStatus.OVERDUE, name: "Overdue" },
  { id: InvoiceStatus.CANCELLED, name: "Cancelled" }
];

// src/entities/estimate.ts
var EstimateStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  VIEWED: "VIEWED",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
  CONVERTED: "CONVERTED"
};
var estimateStatusColors = {
  [EstimateStatus.DRAFT]: "#95a5a6",
  [EstimateStatus.SENT]: "#3498db",
  [EstimateStatus.VIEWED]: "#9b59b6",
  [EstimateStatus.ACCEPTED]: "#27ae60",
  [EstimateStatus.REJECTED]: "#e74c3c",
  [EstimateStatus.EXPIRED]: "#7f8c8d",
  [EstimateStatus.CONVERTED]: "#2ecc71"
};
var estimateStatusChoices = [
  { id: EstimateStatus.DRAFT, name: "Draft" },
  { id: EstimateStatus.SENT, name: "Sent" },
  { id: EstimateStatus.VIEWED, name: "Viewed" },
  { id: EstimateStatus.ACCEPTED, name: "Accepted" },
  { id: EstimateStatus.REJECTED, name: "Rejected" },
  { id: EstimateStatus.EXPIRED, name: "Expired" },
  { id: EstimateStatus.CONVERTED, name: "Converted" }
];

// src/entities/technician.ts
var TeamMemberRole = {
  ADMIN: "ADMIN",
  TECHNICIAN: "TECHNICIAN",
  DISPATCHER: "DISPATCHER"
};
var teamMemberRoleColors = {
  [TeamMemberRole.ADMIN]: "#9b59b6",
  [TeamMemberRole.TECHNICIAN]: "#3498db",
  [TeamMemberRole.DISPATCHER]: "#27ae60"
};
var teamMemberRoleChoices = [
  { id: TeamMemberRole.ADMIN, name: "Admin" },
  { id: TeamMemberRole.TECHNICIAN, name: "Technician" },
  { id: TeamMemberRole.DISPATCHER, name: "Dispatcher" }
];

// src/entities/request.ts
var RequestStatus = {
  NEW: "NEW",
  CONTACTED: "CONTACTED",
  QUOTED: "QUOTED",
  CONVERTED: "CONVERTED",
  CLOSED: "CLOSED"
};
var requestStatusColors = {
  [RequestStatus.NEW]: "#3498db",
  [RequestStatus.CONTACTED]: "#9b59b6",
  [RequestStatus.QUOTED]: "#f39c12",
  [RequestStatus.CONVERTED]: "#27ae60",
  [RequestStatus.CLOSED]: "#95a5a6"
};
var requestStatusChoices = [
  { id: RequestStatus.NEW, name: "New" },
  { id: RequestStatus.CONTACTED, name: "Contacted" },
  { id: RequestStatus.QUOTED, name: "Quoted" },
  { id: RequestStatus.CONVERTED, name: "Converted" },
  { id: RequestStatus.CLOSED, name: "Closed" }
];

// src/entities/service-provider.ts
var ServiceProviderStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  PENDING: "PENDING",
  SUSPENDED: "SUSPENDED"
};
var serviceProviderStatusColors = {
  [ServiceProviderStatus.ACTIVE]: "#27ae60",
  [ServiceProviderStatus.INACTIVE]: "#95a5a6",
  [ServiceProviderStatus.PENDING]: "#f39c12",
  [ServiceProviderStatus.SUSPENDED]: "#e74c3c"
};
var serviceProviderStatusChoices = [
  { id: ServiceProviderStatus.ACTIVE, name: "Active" },
  { id: ServiceProviderStatus.INACTIVE, name: "Inactive" },
  { id: ServiceProviderStatus.PENDING, name: "Pending" },
  { id: ServiceProviderStatus.SUSPENDED, name: "Suspended" }
];
export {
  ClientStatus,
  EstimateStatus,
  InvoiceStatus,
  JobPriority,
  JobStatus,
  RequestStatus,
  ServiceProviderStatus,
  SyncStatus,
  TeamMemberRole,
  clientStatusChoices,
  clientStatusColors,
  estimateStatusChoices,
  estimateStatusColors,
  invoiceStatusChoices,
  invoiceStatusColors,
  jobPriorityChoices,
  jobPriorityColors,
  jobStatusChoices,
  jobStatusColors,
  jobStatusLabels,
  legacyStatusMap,
  normalizeJobStatus,
  requestStatusChoices,
  requestStatusColors,
  serviceProviderStatusChoices,
  serviceProviderStatusColors,
  teamMemberRoleChoices,
  teamMemberRoleColors
};
//# sourceMappingURL=index.mjs.map
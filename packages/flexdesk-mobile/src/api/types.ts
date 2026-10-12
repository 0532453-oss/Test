/**
 * Shared API types for FlexDesk Mobile.
 *
 * These types mirror the NestJS backend response shapes.
 */

// ── Enums ───────────────────────────────────────────────────────────────────

export type JobStatus =
  | 'SCHEDULED'
  | 'DISPATCHED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ON_HOLD';

export type JobPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'TECHNICIAN';

// ── Auth ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  workspaceId: string;
  avatarUrl?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token?: string;
  refresh_token?: string;
  accessToken?: string;
  refreshToken?: string;
  user: AuthUser;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface RegisterResponse {
  access_token?: string;
  refresh_token?: string;
  accessToken?: string;
  refreshToken?: string;
  user: AuthUser;
}

export interface ExchangeCodeRequest {
  code: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  access_token?: string;
  refresh_token?: string;
  accessToken?: string;
  refreshToken?: string;
}

// ── Customers ───────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  createdAt: string;
}

export interface CustomerDetails extends Customer {
  recentJobs?: Job[];
  properties?: Property[];
  invoices?: Invoice[];
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// ── Properties ──────────────────────────────────────────────────────────────

export interface Property {
  id: string;
  customerId: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  lat?: number;
  lng?: number;
  accessNotes?: string;
  serviceNotes?: string;
  isPrimary?: boolean;
}

// ── Jobs ────────────────────────────────────────────────────────────────────

export interface Job {
  id: string;
  title: string;
  description?: string;
  status: JobStatus;
  priority?: JobPriority;
  customerId: string;
  propertyId?: string | null;
  scheduledDate: string;
  scheduledStartTime?: string | null;
  scheduledEndTime?: string | null;
  estimatedDuration?: number;
  completedAt?: string | null;
  location?: { address: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobDetails extends Job {
  customer?: Customer;
  property?: Property;
  technician?: Technician;
  notes?: JobNote[];
  attachments?: JobAttachment[];
  parts?: JobPart[];
}

export interface JobNote {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

export interface JobAttachment {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  createdAt: string;
}

export interface JobPart {
  id: string;
  partId: string;
  partName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Part {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  unitPrice: number;
  category?: string;
  inStock?: number;
}

export interface JobPartTotals {
  cost: number;
  price: number;
  profit: number;
}

export interface AddJobPartRequest {
  partId: string;
  quantity: number;
}

export interface UpdateJobPartRequest {
  quantity: number;
}

export interface CreateJobRequest {
  title: string;
  customerId: string;
  propertyId?: string;
  description?: string;
  status?: JobStatus;
  priority?: JobPriority;
  scheduledDate?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  estimatedDuration?: number;
}

export interface UpdateJobRequest {
  title?: string;
  description?: string;
  status?: JobStatus;
  priority?: JobPriority;
  scheduledDate?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  estimatedDuration?: number;
  notes?: string;
}

export interface UpdateJobStatusRequest {
  status: JobStatus;
}

export interface AssignJobRequest {
  technicianId: string;
}

// ── Invoices ────────────────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  invoiceNumber: string;
  jobId?: string | null;
  customerId: string;
  status: InvoiceStatus;
  amount?: number;
  tax?: number;
  total: number;
  dueDate?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface UpdateInvoiceStatusRequest {
  status: InvoiceStatus;
}

export interface SendInvoiceRequest {
  email?: string;
}

export interface MarkPaidRequest {
  paidAmount?: number;
  paidDate?: string;
}

export interface PaymentLinkResponse {
  url: string;
  paymentIntentId: string;
}

// ── Technicians ─────────────────────────────────────────────────────────────

export interface Technician {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isAvailable: boolean;
  currentLocation?: { lat: number; lng: number };
  lastLocationUpdate?: number;
  workspaceId: string;
}

export interface UpdateTechnicianProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface UpdateLocationRequest {
  lat: number;
  lng: number;
}

export interface UpdateAvailabilityRequest {
  isAvailable: boolean;
}

export interface NextJobResponse {
  job: Job;
  travelTime: number;
  distance: number;
}

// ── Reports ─────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  jobCompletionRate: number;
  jobMetrics: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
  customerMetrics: {
    active: number;
    total: number;
  };
  invoiceMetrics: {
    unpaid: number;
    paid: number;
    overdue: number;
  };
  revenueMetrics: {
    thisMonth: number;
    thisWeek: number;
    today: number;
  };
}

export interface RevenueReport {
  thisMonth: number;
  thisWeek: number;
  thisDay: number;
  ytd: number;
}

export interface TechnicianPerformance {
  technicianId: string;
  completedJobs: number;
  avgRating: number;
  totalRevenue: number;
}

// ── API Error ───────────────────────────────────────────────────────────────

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  timestamp?: string;
  path?: string;
}

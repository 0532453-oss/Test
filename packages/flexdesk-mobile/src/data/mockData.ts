/**
 * FlexDesk Mobile -- Mock Data
 *
 * Realistic sample data for a plumbing & electrical small business.
 * All dates are relative to the current week (Mon-Sun).
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type JobStatus =
  | 'SCHEDULED'
  | 'DISPATCHED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ON_HOLD';

export type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

export interface Property {
  id: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  status: JobStatus;
  customerId: string;
  propertyId: string | null;
  scheduledDate: string; // YYYY-MM-DD
  scheduledStartTime: string | null; // HH:mm
  scheduledEndTime: string | null; // HH:mm
  completedAt: string | null;
  location: { address: string } | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  jobId: string | null;
  status: InvoiceStatus;
  total: number;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getMonday(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function weekDay(offset: number): string {
  const mon = getMonday();
  mon.setDate(mon.getDate() + offset);
  return mon.toISOString().split('T')[0];
}

function pastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

// ── Customers ────────────────────────────────────────────────────────────────

export const customers: Customer[] = [
  {
    id: 'cust-001',
    name: 'Sarah Mitchell',
    email: 'sarah.m@email.com',
    phone: '(555) 234-5678',
    createdAt: pastDate(120),
  },
  {
    id: 'cust-002',
    name: 'James Rodriguez',
    email: 'jrodriguez@example.com',
    phone: '(555) 345-6789',
    createdAt: pastDate(90),
  },
  {
    id: 'cust-003',
    name: 'Emily Chen',
    email: 'echen@example.com',
    phone: '(555) 456-7890',
    createdAt: pastDate(75),
  },
  {
    id: 'cust-004',
    name: 'Robert Thompson',
    email: null,
    phone: '(555) 567-8901',
    createdAt: pastDate(60),
  },
  {
    id: 'cust-005',
    name: 'Maria Garcia',
    email: 'maria.garcia@example.com',
    phone: '(555) 678-9012',
    createdAt: pastDate(45),
  },
  {
    id: 'cust-006',
    name: 'David Park',
    email: 'dpark@email.com',
    phone: null,
    createdAt: pastDate(30),
  },
  {
    id: 'cust-007',
    name: 'Linda Nguyen',
    email: 'linda.n@example.com',
    phone: '(555) 890-1234',
    createdAt: pastDate(15),
  },
  {
    id: 'cust-008',
    name: 'Kevin Williams',
    email: 'kwilliams@email.com',
    phone: '(555) 901-2345',
    createdAt: pastDate(5),
  },
];

// ── Properties ───────────────────────────────────────────────────────────────

export const properties: Property[] = [
  { id: 'prop-001', street: '142 Oak Lane', city: 'Springfield', state: 'IL', zip: '62701' },
  { id: 'prop-002', street: '88 Maple Ave', city: 'Springfield', state: 'IL', zip: '62702' },
  { id: 'prop-003', street: '310 Elm Street', city: 'Springfield', state: 'IL', zip: '62703' },
  { id: 'prop-004', street: '27 Cedar Dr', city: 'Springfield', state: 'IL', zip: '62704' },
  { id: 'prop-005', street: '505 Pine Road', city: 'Chatham', state: 'IL', zip: '62629' },
  { id: 'prop-006', street: '12 Birch Ct', city: 'Rochester', state: 'IL', zip: '62563' },
  { id: 'prop-007', street: '890 Walnut Blvd', city: 'Springfield', state: 'IL', zip: '62701' },
];

// ── Jobs (this week) ─────────────────────────────────────────────────────────

export const jobs: Job[] = [
  // Monday
  {
    id: 'job-001',
    title: 'Kitchen Faucet Replacement',
    description: 'Replace leaking kitchen faucet with customer-supplied Moen fixture.',
    status: 'COMPLETED',
    customerId: 'cust-001',
    propertyId: 'prop-001',
    scheduledDate: weekDay(0),
    scheduledStartTime: '08:00',
    scheduledEndTime: '10:00',
    completedAt: weekDay(0) + 'T09:45:00Z',
    location: null,
  },
  {
    id: 'job-002',
    title: 'Bathroom Rewire',
    description: 'Rewire bathroom outlets to GFCI per code update.',
    status: 'COMPLETED',
    customerId: 'cust-002',
    propertyId: 'prop-002',
    scheduledDate: weekDay(0),
    scheduledStartTime: '11:00',
    scheduledEndTime: '14:00',
    completedAt: weekDay(0) + 'T13:30:00Z',
    location: null,
  },
  // Tuesday
  {
    id: 'job-003',
    title: 'Water Heater Inspection',
    description: 'Annual inspection and flush of 50-gallon water heater.',
    status: 'COMPLETED',
    customerId: 'cust-003',
    propertyId: 'prop-003',
    scheduledDate: weekDay(1),
    scheduledStartTime: '09:00',
    scheduledEndTime: '10:30',
    completedAt: weekDay(1) + 'T10:15:00Z',
    location: null,
  },
  {
    id: 'job-004',
    title: 'Ceiling Fan Installation',
    description: 'Install new 52" ceiling fan in living room. Existing wiring available.',
    status: 'COMPLETED',
    customerId: 'cust-005',
    propertyId: 'prop-005',
    scheduledDate: weekDay(1),
    scheduledStartTime: '13:00',
    scheduledEndTime: '15:00',
    completedAt: weekDay(1) + 'T14:40:00Z',
    location: null,
  },
  // Wednesday
  {
    id: 'job-005',
    title: 'Garbage Disposal Repair',
    description: 'Diagnose and repair jammed garbage disposal unit.',
    status: 'COMPLETED',
    customerId: 'cust-004',
    propertyId: 'prop-004',
    scheduledDate: weekDay(2),
    scheduledStartTime: '08:30',
    scheduledEndTime: '09:30',
    completedAt: weekDay(2) + 'T09:20:00Z',
    location: null,
  },
  {
    id: 'job-006',
    title: 'Panel Upgrade Consultation',
    description: 'Evaluate existing 100A panel for upgrade to 200A service.',
    status: 'IN_PROGRESS',
    customerId: 'cust-006',
    propertyId: 'prop-006',
    scheduledDate: weekDay(2),
    scheduledStartTime: '11:00',
    scheduledEndTime: '12:30',
    completedAt: null,
    location: null,
  },
  // Thursday
  {
    id: 'job-007',
    title: 'Sump Pump Replacement',
    description: 'Replace failed sump pump with Wayne CDU980E.',
    status: 'SCHEDULED',
    customerId: 'cust-001',
    propertyId: 'prop-001',
    scheduledDate: weekDay(3),
    scheduledStartTime: '08:00',
    scheduledEndTime: '11:00',
    completedAt: null,
    location: null,
  },
  {
    id: 'job-008',
    title: 'Outdoor Lighting Setup',
    description: 'Install 6 low-voltage landscape lights along front walkway.',
    status: 'SCHEDULED',
    customerId: 'cust-007',
    propertyId: 'prop-007',
    scheduledDate: weekDay(3),
    scheduledStartTime: '13:00',
    scheduledEndTime: '16:00',
    completedAt: null,
    location: null,
  },
  // Friday
  {
    id: 'job-009',
    title: 'Toilet Rebuild',
    description: 'Rebuild fill valve and flapper on master bath toilet.',
    status: 'DISPATCHED',
    customerId: 'cust-003',
    propertyId: 'prop-003',
    scheduledDate: weekDay(4),
    scheduledStartTime: '09:00',
    scheduledEndTime: '10:30',
    completedAt: null,
    location: null,
  },
  {
    id: 'job-010',
    title: 'Smoke Detector Replacement',
    description: 'Replace 8 hardwired smoke detectors throughout the house.',
    status: 'SCHEDULED',
    customerId: 'cust-002',
    propertyId: 'prop-002',
    scheduledDate: weekDay(4),
    scheduledStartTime: '11:00',
    scheduledEndTime: '13:00',
    completedAt: null,
    location: null,
  },
  // Saturday
  {
    id: 'job-011',
    title: 'Emergency Pipe Burst',
    description: 'Emergency call: burst pipe in basement. Shut off and repair.',
    status: 'ON_HOLD',
    customerId: 'cust-005',
    propertyId: 'prop-005',
    scheduledDate: weekDay(5),
    scheduledStartTime: null,
    scheduledEndTime: null,
    completedAt: null,
    location: { address: '505 Pine Road, Chatham IL' },
  },
  {
    id: 'job-012',
    title: 'EV Charger Installation',
    description: 'Install Level 2 EV charger (NEMA 14-50) in garage.',
    status: 'SCHEDULED',
    customerId: 'cust-006',
    propertyId: 'prop-006',
    scheduledDate: weekDay(5),
    scheduledStartTime: '10:00',
    scheduledEndTime: '14:00',
    completedAt: null,
    location: null,
  },
  // Always-today job — ensures calendar default day view is never empty
  {
    id: 'job-013',
    title: 'Drain Line Camera Inspection',
    description: 'Run camera scope through main drain line to diagnose slow drainage.',
    status: 'SCHEDULED',
    customerId: 'cust-007',
    propertyId: 'prop-007',
    scheduledDate: today(),
    scheduledStartTime: '14:00',
    scheduledEndTime: '15:30',
    completedAt: null,
    location: null,
  },
];

// ── Invoices ─────────────────────────────────────────────────────────────────

export const invoices: Invoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2026-041',
    customerId: 'cust-001',
    jobId: 'job-001',
    status: 'PAID',
    total: 385.0,
    dueDate: weekDay(0),
    paidAt: weekDay(0) + 'T16:00:00Z',
    createdAt: weekDay(0),
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2026-042',
    customerId: 'cust-002',
    jobId: 'job-002',
    status: 'PAID',
    total: 1250.0,
    dueDate: pastDate(5),
    paidAt: weekDay(0) + 'T17:00:00Z',
    createdAt: weekDay(0),
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-2026-043',
    customerId: 'cust-003',
    jobId: 'job-003',
    status: 'SENT',
    total: 275.0,
    dueDate: weekDay(6),
    paidAt: null,
    createdAt: weekDay(1),
  },
  {
    id: 'inv-004',
    invoiceNumber: 'INV-2026-044',
    customerId: 'cust-005',
    jobId: 'job-004',
    status: 'PAID',
    total: 420.0,
    dueDate: weekDay(3),
    paidAt: weekDay(2) + 'T10:00:00Z',
    createdAt: weekDay(1),
  },
  {
    id: 'inv-005',
    invoiceNumber: 'INV-2026-045',
    customerId: 'cust-004',
    jobId: 'job-005',
    status: 'SENT',
    total: 195.0,
    dueDate: weekDay(6),
    paidAt: null,
    createdAt: weekDay(2),
  },
  {
    id: 'inv-006',
    invoiceNumber: 'INV-2026-038',
    customerId: 'cust-007',
    jobId: null,
    status: 'OVERDUE',
    total: 860.0,
    dueDate: pastDate(10),
    paidAt: null,
    createdAt: pastDate(25),
  },
  {
    id: 'inv-007',
    invoiceNumber: 'INV-2026-035',
    customerId: 'cust-002',
    jobId: null,
    status: 'OVERDUE',
    total: 1480.0,
    dueDate: pastDate(15),
    paidAt: null,
    createdAt: pastDate(30),
  },
  {
    id: 'inv-008',
    invoiceNumber: 'INV-2026-046',
    customerId: 'cust-006',
    jobId: null,
    status: 'DRAFT',
    total: 3200.0,
    dueDate: weekDay(6),
    paidAt: null,
    createdAt: weekDay(2),
  },
  {
    id: 'inv-009',
    invoiceNumber: 'INV-2026-030',
    customerId: 'cust-003',
    jobId: null,
    status: 'CANCELLED',
    total: 150.0,
    dueDate: pastDate(20),
    paidAt: null,
    createdAt: pastDate(35),
  },
  {
    id: 'inv-010',
    invoiceNumber: 'INV-2026-039',
    customerId: 'cust-001',
    jobId: null,
    status: 'PAID',
    total: 540.0,
    dueDate: pastDate(7),
    paidAt: pastDate(8),
    createdAt: pastDate(20),
  },
];

// ── Formatting helpers ──────────────────────────────────────────────────────

/** Format a number as "$X,XXX" with commas, no decimals. */
export function formatCurrency(amount: number): string {
  return '$' + amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/** Format a date string as "Jan 15" (short) or "Feb 10, 2026" (full). */
export function formatDate(
  date: Date | string,
  style: 'short' | 'full' = 'short'
): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  if (style === 'full') {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Lookup helpers ───────────────────────────────────────────────────────────

export function getCustomerById(id: string): Customer | undefined {
  return customers.find(c => c.id === id);
}

export function getPropertyById(id: string): Property | undefined {
  return properties.find(p => p.id === id);
}

export function getJobsForCustomer(customerId: string): Job[] {
  return jobs.filter(j => j.customerId === customerId);
}

export function getInvoicesForCustomer(customerId: string): Invoice[] {
  return invoices.filter(i => i.customerId === customerId);
}

export function getJobsForDate(date: string): Job[] {
  return jobs
    .filter(j => j.scheduledDate === date)
    .sort((a, b) => {
      if (!a.scheduledStartTime) return 1;
      if (!b.scheduledStartTime) return -1;
      return a.scheduledStartTime.localeCompare(b.scheduledStartTime);
    });
}

/** The workspace name shown in the dashboard header. */
export const WORKSPACE_NAME = 'Mitchell Plumbing & Electric';

/** Weekly target for the health ring. */
export const WEEKLY_TARGET = 10;

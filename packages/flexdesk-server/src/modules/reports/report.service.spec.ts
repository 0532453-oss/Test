import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { JobStatus, InvoiceStatus, EstimateStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { ReportService } from './report.service';

import { PrismaService } from '@/core/database/prisma.service';
import * as workspaceContext from '@/core/database/workspace-context';

// Mock workspace context
jest.mock('@/core/database/workspace-context', () => ({
  getWorkspaceId: jest.fn(),
}));

describe('ReportService', () => {
  let service: ReportService;
  let prisma: jest.Mocked<PrismaService>;

  const mockWorkspaceId = 'workspace-123';

  const mockInvoices = [
    {
      id: 'inv-1',
      workspaceId: mockWorkspaceId,
      status: InvoiceStatus.PAID,
      total: new Decimal(150.0),
      paidAt: new Date('2024-03-15'),
      createdAt: new Date('2024-03-10'),
      lineItems: [
        { description: 'Service for job: HVAC Repair', total: new Decimal(150.0) },
      ],
    },
    {
      id: 'inv-2',
      workspaceId: mockWorkspaceId,
      status: InvoiceStatus.PAID,
      total: new Decimal(200.0),
      paidAt: new Date('2024-03-20'),
      createdAt: new Date('2024-03-18'),
      lineItems: [
        { description: 'Labor for plumbing', total: new Decimal(100.0) },
        { description: 'Parts and materials', total: new Decimal(100.0) },
      ],
    },
    {
      id: 'inv-3',
      workspaceId: mockWorkspaceId,
      status: InvoiceStatus.SENT,
      total: new Decimal(75.0),
      paidAt: null,
      createdAt: new Date('2024-03-25'),
      lineItems: [
        { description: 'Emergency service', total: new Decimal(75.0) },
      ],
    },
    {
      id: 'inv-4',
      workspaceId: mockWorkspaceId,
      status: InvoiceStatus.OVERDUE,
      total: new Decimal(100.0),
      paidAt: null,
      createdAt: new Date('2024-02-01'),
      lineItems: [
        { description: 'Maintenance visit', total: new Decimal(100.0) },
      ],
    },
  ];

  const mockTechnicians = [
    {
      id: 'tech-1',
      workspaceId: mockWorkspaceId,
      user: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
      jobs: [
        {
          id: 'job-1',
          status: JobStatus.COMPLETED,
          scheduledAt: new Date('2024-03-10T09:00:00Z'),
          startedAt: new Date('2024-03-10T09:00:00Z'),
          completedAt: new Date('2024-03-10T10:30:00Z'),
          estimatedDuration: 120,
          createdAt: new Date('2024-03-05'),
          invoice: { status: InvoiceStatus.PAID, total: new Decimal(150.0) },
        },
        {
          id: 'job-2',
          status: JobStatus.COMPLETED,
          scheduledAt: new Date('2024-03-12T10:00:00Z'),
          startedAt: new Date('2024-03-12T10:00:00Z'),
          completedAt: new Date('2024-03-12T11:00:00Z'),
          estimatedDuration: 60,
          createdAt: new Date('2024-03-08'),
          invoice: { status: InvoiceStatus.PAID, total: new Decimal(200.0) },
        },
        {
          id: 'job-3',
          status: JobStatus.IN_PROGRESS,
          scheduledAt: new Date('2024-03-15T09:00:00Z'),
          startedAt: new Date('2024-03-15T09:00:00Z'),
          completedAt: null,
          estimatedDuration: 90,
          createdAt: new Date('2024-03-14'),
          invoice: null,
        },
      ],
    },
    {
      id: 'tech-2',
      workspaceId: mockWorkspaceId,
      user: { id: 'user-2', firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com' },
      jobs: [
        {
          id: 'job-4',
          status: JobStatus.COMPLETED,
          scheduledAt: new Date('2024-03-11T14:00:00Z'),
          startedAt: new Date('2024-03-11T14:00:00Z'),
          completedAt: new Date('2024-03-11T18:00:00Z'), // Late completion
          estimatedDuration: 60,
          createdAt: new Date('2024-03-09'),
          invoice: { status: InvoiceStatus.SENT, total: new Decimal(100.0) },
        },
      ],
    },
  ];

  const mockCustomers = [
    {
      id: 'cust-1',
      workspaceId: mockWorkspaceId,
      name: 'Acme Corp',
      createdAt: new Date('2023-01-15'),
      jobs: [
        {
          id: 'job-1',
          status: JobStatus.COMPLETED,
          createdAt: new Date('2024-03-10'),
          invoice: { status: InvoiceStatus.PAID, total: new Decimal(150.0) },
        },
        {
          id: 'job-2',
          status: JobStatus.COMPLETED,
          createdAt: new Date('2024-03-15'),
          invoice: { status: InvoiceStatus.PAID, total: new Decimal(200.0) },
        },
      ],
      estimates: [
        { id: 'est-1', status: EstimateStatus.CONVERTED, createdAt: new Date('2024-03-01') },
        { id: 'est-2', status: EstimateStatus.SENT, createdAt: new Date('2024-03-20') },
      ],
    },
    {
      id: 'cust-2',
      workspaceId: mockWorkspaceId,
      name: 'New Customer',
      createdAt: new Date('2024-03-01'), // New customer in period
      jobs: [
        {
          id: 'job-3',
          status: JobStatus.COMPLETED,
          createdAt: new Date('2024-03-12'),
          invoice: { status: InvoiceStatus.PAID, total: new Decimal(100.0) },
        },
      ],
      estimates: [
        { id: 'est-3', status: EstimateStatus.REJECTED, createdAt: new Date('2024-03-05') },
      ],
    },
    {
      id: 'cust-3',
      workspaceId: mockWorkspaceId,
      name: 'Inactive Customer',
      createdAt: new Date('2022-06-01'),
      jobs: [],
      estimates: [],
    },
  ];

  const mockJobs = [
    {
      id: 'job-1',
      workspaceId: mockWorkspaceId,
      customerId: 'cust-1',
      status: JobStatus.COMPLETED,
      createdAt: new Date('2024-03-10'),
    },
    {
      id: 'job-2',
      workspaceId: mockWorkspaceId,
      customerId: 'cust-1',
      status: JobStatus.COMPLETED,
      createdAt: new Date('2024-03-15'),
    },
    {
      id: 'job-3',
      workspaceId: mockWorkspaceId,
      customerId: 'cust-2',
      status: JobStatus.IN_PROGRESS,
      createdAt: new Date('2024-03-20'),
    },
    {
      id: 'job-4',
      workspaceId: mockWorkspaceId,
      customerId: 'cust-1',
      status: JobStatus.SCHEDULED,
      createdAt: new Date('2024-03-25'),
    },
  ];

  const mockEstimates = [
    { id: 'est-1', workspaceId: mockWorkspaceId, status: EstimateStatus.CONVERTED, createdAt: new Date('2024-03-01') },
    { id: 'est-2', workspaceId: mockWorkspaceId, status: EstimateStatus.SENT, createdAt: new Date('2024-03-10') },
    { id: 'est-3', workspaceId: mockWorkspaceId, status: EstimateStatus.DRAFT, createdAt: new Date('2024-03-15') },
    { id: 'est-4', workspaceId: mockWorkspaceId, status: EstimateStatus.ACCEPTED, createdAt: new Date('2024-03-20') },
  ];

  beforeEach(async () => {
    const mockPrismaService = {
      invoice: {
        findMany: jest.fn(),
      },
      technician: {
        findMany: jest.fn(),
      },
      customer: {
        findMany: jest.fn(),
      },
      job: {
        findMany: jest.fn(),
      },
      estimate: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;

    // Set default workspace context
    (workspaceContext.getWorkspaceId as jest.Mock).mockReturnValue(mockWorkspaceId);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateDateRange', () => {
    it('should return valid date range', () => {
      const result = service.validateDateRange('2024-01-01', '2024-12-31');

      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      expect(result.startDate < result.endDate).toBe(true);
    });

    it('should throw for invalid start date', () => {
      expect(() => service.validateDateRange('invalid', '2024-12-31')).toThrow(
        BadRequestException,
      );
    });

    it('should throw for invalid end date', () => {
      expect(() => service.validateDateRange('2024-01-01', 'invalid')).toThrow(
        BadRequestException,
      );
    });

    it('should throw when start date is after end date', () => {
      expect(() => service.validateDateRange('2024-12-31', '2024-01-01')).toThrow(
        'Start date must be before end date',
      );
    });
  });

  describe('getRevenueReport', () => {
    it('should return revenue report with correct metrics', async () => {
      (prisma.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);

      const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
      const result = await service.getRevenueReport(dateRange);

      expect(result.totalRevenue).toBe(350); // inv-1 (150) + inv-2 (200)
      expect(result.paidInvoices).toBe(2);
      expect(result.pendingRevenue).toBe(75); // inv-3
      expect(result.pendingInvoices).toBe(1);
      expect(result.overdueRevenue).toBe(100); // inv-4
      expect(result.overdueInvoices).toBe(1);
      expect(result.averageInvoiceValue).toBe(175); // 350 / 2
    });

    it('should calculate revenue by month', async () => {
      (prisma.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);

      const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
      const result = await service.getRevenueReport(dateRange);

      expect(result.revenueByMonth).toBeDefined();
      expect(result.revenueByMonth.length).toBeGreaterThan(0);
      // Both paid invoices are in March 2024
      const march = result.revenueByMonth.find(m => m.month === '2024-03');
      expect(march).toBeDefined();
      expect(march?.revenue).toBe(350);
      expect(march?.invoiceCount).toBe(2);
    });

    it('should calculate revenue by service type', async () => {
      (prisma.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);

      const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
      const result = await service.getRevenueReport(dateRange);

      expect(result.revenueByServiceType).toBeDefined();
      expect(result.revenueByServiceType.length).toBeGreaterThan(0);
      // Check that all revenue types have positive percentages
      const totalPercentage = result.revenueByServiceType.reduce((sum, s) => sum + s.percentage, 0);
      expect(Math.round(totalPercentage)).toBe(100);
    });

    it('should throw when workspace context is missing', async () => {
      (workspaceContext.getWorkspaceId as jest.Mock).mockReturnValue(null);

      const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
      await expect(service.getRevenueReport(dateRange)).rejects.toThrow(
        'Workspace context is required',
      );
    });

    it('should handle empty invoices', async () => {
      (prisma.invoice.findMany as jest.Mock).mockResolvedValue([]);

      const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
      const result = await service.getRevenueReport(dateRange);

      expect(result.totalRevenue).toBe(0);
      expect(result.paidInvoices).toBe(0);
      expect(result.averageInvoiceValue).toBe(0);
    });
  });

  describe('getTechnicianPerformanceReport', () => {
    it('should return technician performance summary', async () => {
      (prisma.technician.findMany as jest.Mock).mockResolvedValue(mockTechnicians);

      const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
      const result = await service.getTechnicianPerformanceReport(dateRange);

      expect(result.totalTechnicians).toBe(2);
      expect(result.technicians).toHaveLength(2);
      expect(result.topPerformers.length).toBeLessThanOrEqual(5);
    });

    it('should calculate correct metrics for individual technician', async () => {
      (prisma.technician.findMany as jest.Mock).mockResolvedValue(mockTechnicians);

      const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
      const result = await service.getTechnicianPerformanceReport(dateRange);

      const johnDoe = result.technicians.find(t => t.technicianName === 'John Doe');
      expect(johnDoe).toBeDefined();
      expect(johnDoe?.totalJobs).toBe(3);
      expect(johnDoe?.completedJobs).toBe(2);
      expect(johnDoe?.completionRate).toBeCloseTo(66.67, 1);
      expect(johnDoe?.totalRevenue).toBe(350); // 150 + 200 from paid invoices
    });

    it('should calculate on-time rate correctly', async () => {
      (prisma.technician.findMany as jest.Mock).mockResolvedValue(mockTechnicians);

      const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
      const result = await service.getTechnicianPerformanceReport(dateRange);

      // John Doe completed both jobs on time (within estimated duration)
      const johnDoe = result.technicians.find(t => t.technicianName === 'John Doe');
      expect(johnDoe?.onTimeRate).toBe(100);

      // Jane Smith was late (4 hours for 60 min job)
      const janeSmith = result.technicians.find(t => t.technicianName === 'Jane Smith');
      expect(janeSmith?.onTimeRate).toBe(0);
    });

    it('should calculate average job duration', async () => {
      (prisma.technician.findMany as jest.Mock).mockResolvedValue(mockTechnicians);

      const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
      const result = await service.getTechnicianPerformanceReport(dateRange);

      const johnDoe = result.technicians.find(t => t.technicianName === 'John Doe');
      // Job 1: 90 min, Job 2: 60 min -> avg = 75 min
      expect(johnDoe?.averageJobDuration).toBe(75);
    });

    it('should handle empty technicians', async () => {
      (prisma.technician.findMany as jest.Mock).mockResolvedValue([]);

      const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
      const result = await service.getTechnicianPerformanceReport(dateRange);

      expect(result.totalTechnicians).toBe(0);
      expect(result.averageCompletionRate).toBe(0);
      expect(result.technicians).toHaveLength(0);
    });
  });

  describe('getCustomerAnalytics', () => {
    it('should return customer analytics summary', async () => {
      (prisma.customer.findMany as jest.Mock).mockResolvedValue(mockCustomers);

      const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
      const result = await service.getCustomerAnalytics(dateRange);

      expect(result.totalCustomers).toBe(3);
      expect(result.activeCustomers).toBe(2); // cust-1 and cust-2 have jobs
      expect(result.newCustomersInPeriod).toBe(1); // cust-2 created in period
    });

    it('should identify repeat customers', async () => {
      (prisma.customer.findMany as jest.Mock).mockResolvedValue(mockCustomers);

      const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
      const result = await service.getCustomerAnalytics(dateRange);

      expect(result.repeatCustomers).toBe(1); // cust-1 has 2+ jobs
    });

    it('should calculate top customers by revenue', async () => {
      (prisma.customer.findMany as jest.Mock).mockResolvedValue(mockCustomers);

      const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
      const result = await service.getCustomerAnalytics(dateRange);

      expect(result.topCustomers).toBeDefined();
      expect(result.topCustomers.length).toBeGreaterThan(0);
      // First customer should be Acme Corp with highest revenue
      expect(result.topCustomers[0].customerName).toBe('Acme Corp');
      expect(result.topCustomers[0].totalRevenue).toBe(350);
    });

    it('should calculate estimate conversion rate per customer', async () => {
      (prisma.customer.findMany as jest.Mock).mockResolvedValue(mockCustomers);

      const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
      const result = await service.getCustomerAnalytics(dateRange);

      const acmeCorp = result.topCustomers.find(c => c.customerName === 'Acme Corp');
      // 1 converted out of 2 sent = 50%
      expect(acmeCorp?.estimateConversionRate).toBe(50);
    });

    it('should handle customers with no jobs', async () => {
      (prisma.customer.findMany as jest.Mock).mockResolvedValue(mockCustomers);

      const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
      const result = await service.getCustomerAnalytics(dateRange);

      // Inactive Customer should not be in topCustomers (no jobs)
      const inactiveCustomer = result.topCustomers.find(
        c => c.customerName === 'Inactive Customer',
      );
      expect(inactiveCustomer).toBeUndefined();
    });
  });

  describe('getDashboardSummary', () => {
    beforeEach(() => {
      (prisma.invoice.findMany as jest.Mock).mockResolvedValue(mockInvoices);
      (prisma.job.findMany as jest.Mock).mockResolvedValue(mockJobs);
      (prisma.customer.findMany as jest.Mock).mockResolvedValue(mockCustomers);
      (prisma.estimate.findMany as jest.Mock).mockResolvedValue(mockEstimates);
    });

    it('should return dashboard summary with all sections', async () => {
      const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
      const result = await service.getDashboardSummary(dateRange);

      expect(result.revenue).toBeDefined();
      expect(result.jobs).toBeDefined();
      expect(result.customers).toBeDefined();
      expect(result.estimates).toBeDefined();
    });

    it('should calculate revenue metrics', async () => {
      const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
      const result = await service.getDashboardSummary(dateRange);

      expect(result.revenue.total).toBe(350);
      expect(result.revenue.pending).toBe(75);
      expect(result.revenue.overdue).toBe(100);
    });

    it('should calculate job metrics', async () => {
      const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
      const result = await service.getDashboardSummary(dateRange);

      expect(result.jobs.total).toBe(4);
      expect(result.jobs.completed).toBe(2);
      expect(result.jobs.inProgress).toBe(1);
      expect(result.jobs.scheduled).toBe(1);
      expect(result.jobs.completionRate).toBe(50);
    });

    it('should calculate customer metrics', async () => {
      const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
      const result = await service.getDashboardSummary(dateRange);

      expect(result.customers.total).toBe(3);
      expect(result.customers.new).toBe(1);
      expect(result.customers.active).toBe(2); // 2 unique customer IDs in jobs
    });

    it('should calculate estimate metrics', async () => {
      const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
      const result = await service.getDashboardSummary(dateRange);

      expect(result.estimates.total).toBe(4);
      expect(result.estimates.pending).toBe(1); // Only SENT status
      // 2 converted/accepted out of 3 sent (excluding draft)
      expect(result.estimates.conversionRate).toBeCloseTo(66.67, 1);
    });

    it('should calculate revenue growth', async () => {
      // Mock previous period with lower revenue
      const previousInvoices = [
        { id: 'prev-1', status: InvoiceStatus.PAID, total: new Decimal(100.0) },
      ];
      (prisma.invoice.findMany as jest.Mock)
        .mockResolvedValueOnce(mockInvoices) // Current period
        .mockResolvedValueOnce(previousInvoices); // Previous period

      const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
      const result = await service.getDashboardSummary(dateRange);

      // Growth: (350 - 100) / 100 * 100 = 250%
      expect(result.revenue.growth).toBe(250);
    });

    it('should handle zero previous revenue', async () => {
      (prisma.invoice.findMany as jest.Mock)
        .mockResolvedValueOnce(mockInvoices) // Current period
        .mockResolvedValueOnce([]); // Previous period (no revenue)

      const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
      const result = await service.getDashboardSummary(dateRange);

      // When previous is 0 and current > 0, growth should be 100%
      expect(result.revenue.growth).toBe(100);
    });
  });

  describe('workspace context validation', () => {
    it('should throw BadRequestException when workspace is not set', async () => {
      (workspaceContext.getWorkspaceId as jest.Mock).mockReturnValue(null);

      const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };

      await expect(service.getRevenueReport(dateRange)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getTechnicianPerformanceReport(dateRange)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getCustomerAnalytics(dateRange)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getDashboardSummary(dateRange)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

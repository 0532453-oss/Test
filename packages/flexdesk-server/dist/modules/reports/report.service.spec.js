"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const report_service_1 = require("./report.service");
const prisma_service_1 = require("../../core/database/prisma.service");
const workspaceContext = require("../../core/database/workspace-context");
jest.mock('@/core/database/workspace-context', () => ({
    getWorkspaceId: jest.fn(),
}));
describe('ReportService', () => {
    let service;
    let prisma;
    const mockWorkspaceId = 'workspace-123';
    const mockInvoices = [
        {
            id: 'inv-1',
            workspaceId: mockWorkspaceId,
            status: client_1.InvoiceStatus.PAID,
            total: new library_1.Decimal(150.0),
            paidAt: new Date('2024-03-15'),
            createdAt: new Date('2024-03-10'),
            lineItems: [
                { description: 'Service for job: HVAC Repair', total: new library_1.Decimal(150.0) },
            ],
        },
        {
            id: 'inv-2',
            workspaceId: mockWorkspaceId,
            status: client_1.InvoiceStatus.PAID,
            total: new library_1.Decimal(200.0),
            paidAt: new Date('2024-03-20'),
            createdAt: new Date('2024-03-18'),
            lineItems: [
                { description: 'Labor for plumbing', total: new library_1.Decimal(100.0) },
                { description: 'Parts and materials', total: new library_1.Decimal(100.0) },
            ],
        },
        {
            id: 'inv-3',
            workspaceId: mockWorkspaceId,
            status: client_1.InvoiceStatus.SENT,
            total: new library_1.Decimal(75.0),
            paidAt: null,
            createdAt: new Date('2024-03-25'),
            lineItems: [
                { description: 'Emergency service', total: new library_1.Decimal(75.0) },
            ],
        },
        {
            id: 'inv-4',
            workspaceId: mockWorkspaceId,
            status: client_1.InvoiceStatus.OVERDUE,
            total: new library_1.Decimal(100.0),
            paidAt: null,
            createdAt: new Date('2024-02-01'),
            lineItems: [
                { description: 'Maintenance visit', total: new library_1.Decimal(100.0) },
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
                    status: client_1.JobStatus.COMPLETED,
                    scheduledAt: new Date('2024-03-10T09:00:00Z'),
                    startedAt: new Date('2024-03-10T09:00:00Z'),
                    completedAt: new Date('2024-03-10T10:30:00Z'),
                    estimatedDuration: 120,
                    createdAt: new Date('2024-03-05'),
                    invoice: { status: client_1.InvoiceStatus.PAID, total: new library_1.Decimal(150.0) },
                },
                {
                    id: 'job-2',
                    status: client_1.JobStatus.COMPLETED,
                    scheduledAt: new Date('2024-03-12T10:00:00Z'),
                    startedAt: new Date('2024-03-12T10:00:00Z'),
                    completedAt: new Date('2024-03-12T11:00:00Z'),
                    estimatedDuration: 60,
                    createdAt: new Date('2024-03-08'),
                    invoice: { status: client_1.InvoiceStatus.PAID, total: new library_1.Decimal(200.0) },
                },
                {
                    id: 'job-3',
                    status: client_1.JobStatus.IN_PROGRESS,
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
                    status: client_1.JobStatus.COMPLETED,
                    scheduledAt: new Date('2024-03-11T14:00:00Z'),
                    startedAt: new Date('2024-03-11T14:00:00Z'),
                    completedAt: new Date('2024-03-11T18:00:00Z'),
                    estimatedDuration: 60,
                    createdAt: new Date('2024-03-09'),
                    invoice: { status: client_1.InvoiceStatus.SENT, total: new library_1.Decimal(100.0) },
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
                    status: client_1.JobStatus.COMPLETED,
                    createdAt: new Date('2024-03-10'),
                    invoice: { status: client_1.InvoiceStatus.PAID, total: new library_1.Decimal(150.0) },
                },
                {
                    id: 'job-2',
                    status: client_1.JobStatus.COMPLETED,
                    createdAt: new Date('2024-03-15'),
                    invoice: { status: client_1.InvoiceStatus.PAID, total: new library_1.Decimal(200.0) },
                },
            ],
            estimates: [
                { id: 'est-1', status: client_1.EstimateStatus.CONVERTED, createdAt: new Date('2024-03-01') },
                { id: 'est-2', status: client_1.EstimateStatus.SENT, createdAt: new Date('2024-03-20') },
            ],
        },
        {
            id: 'cust-2',
            workspaceId: mockWorkspaceId,
            name: 'New Customer',
            createdAt: new Date('2024-03-01'),
            jobs: [
                {
                    id: 'job-3',
                    status: client_1.JobStatus.COMPLETED,
                    createdAt: new Date('2024-03-12'),
                    invoice: { status: client_1.InvoiceStatus.PAID, total: new library_1.Decimal(100.0) },
                },
            ],
            estimates: [
                { id: 'est-3', status: client_1.EstimateStatus.REJECTED, createdAt: new Date('2024-03-05') },
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
            status: client_1.JobStatus.COMPLETED,
            createdAt: new Date('2024-03-10'),
        },
        {
            id: 'job-2',
            workspaceId: mockWorkspaceId,
            customerId: 'cust-1',
            status: client_1.JobStatus.COMPLETED,
            createdAt: new Date('2024-03-15'),
        },
        {
            id: 'job-3',
            workspaceId: mockWorkspaceId,
            customerId: 'cust-2',
            status: client_1.JobStatus.IN_PROGRESS,
            createdAt: new Date('2024-03-20'),
        },
        {
            id: 'job-4',
            workspaceId: mockWorkspaceId,
            customerId: 'cust-1',
            status: client_1.JobStatus.SCHEDULED,
            createdAt: new Date('2024-03-25'),
        },
    ];
    const mockEstimates = [
        { id: 'est-1', workspaceId: mockWorkspaceId, status: client_1.EstimateStatus.CONVERTED, createdAt: new Date('2024-03-01') },
        { id: 'est-2', workspaceId: mockWorkspaceId, status: client_1.EstimateStatus.SENT, createdAt: new Date('2024-03-10') },
        { id: 'est-3', workspaceId: mockWorkspaceId, status: client_1.EstimateStatus.DRAFT, createdAt: new Date('2024-03-15') },
        { id: 'est-4', workspaceId: mockWorkspaceId, status: client_1.EstimateStatus.ACCEPTED, createdAt: new Date('2024-03-20') },
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                report_service_1.ReportService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(report_service_1.ReportService);
        prisma = module.get(prisma_service_1.PrismaService);
        workspaceContext.getWorkspaceId.mockReturnValue(mockWorkspaceId);
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
            expect(() => service.validateDateRange('invalid', '2024-12-31')).toThrow(common_1.BadRequestException);
        });
        it('should throw for invalid end date', () => {
            expect(() => service.validateDateRange('2024-01-01', 'invalid')).toThrow(common_1.BadRequestException);
        });
        it('should throw when start date is after end date', () => {
            expect(() => service.validateDateRange('2024-12-31', '2024-01-01')).toThrow('Start date must be before end date');
        });
    });
    describe('getRevenueReport', () => {
        it('should return revenue report with correct metrics', async () => {
            prisma.invoice.findMany.mockResolvedValue(mockInvoices);
            const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
            const result = await service.getRevenueReport(dateRange);
            expect(result.totalRevenue).toBe(350);
            expect(result.paidInvoices).toBe(2);
            expect(result.pendingRevenue).toBe(75);
            expect(result.pendingInvoices).toBe(1);
            expect(result.overdueRevenue).toBe(100);
            expect(result.overdueInvoices).toBe(1);
            expect(result.averageInvoiceValue).toBe(175);
        });
        it('should calculate revenue by month', async () => {
            prisma.invoice.findMany.mockResolvedValue(mockInvoices);
            const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
            const result = await service.getRevenueReport(dateRange);
            expect(result.revenueByMonth).toBeDefined();
            expect(result.revenueByMonth.length).toBeGreaterThan(0);
            const march = result.revenueByMonth.find(m => m.month === '2024-03');
            expect(march).toBeDefined();
            expect(march?.revenue).toBe(350);
            expect(march?.invoiceCount).toBe(2);
        });
        it('should calculate revenue by service type', async () => {
            prisma.invoice.findMany.mockResolvedValue(mockInvoices);
            const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
            const result = await service.getRevenueReport(dateRange);
            expect(result.revenueByServiceType).toBeDefined();
            expect(result.revenueByServiceType.length).toBeGreaterThan(0);
            const totalPercentage = result.revenueByServiceType.reduce((sum, s) => sum + s.percentage, 0);
            expect(Math.round(totalPercentage)).toBe(100);
        });
        it('should throw when workspace context is missing', async () => {
            workspaceContext.getWorkspaceId.mockReturnValue(null);
            const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
            await expect(service.getRevenueReport(dateRange)).rejects.toThrow('Workspace context is required');
        });
        it('should handle empty invoices', async () => {
            prisma.invoice.findMany.mockResolvedValue([]);
            const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
            const result = await service.getRevenueReport(dateRange);
            expect(result.totalRevenue).toBe(0);
            expect(result.paidInvoices).toBe(0);
            expect(result.averageInvoiceValue).toBe(0);
        });
    });
    describe('getTechnicianPerformanceReport', () => {
        it('should return technician performance summary', async () => {
            prisma.technician.findMany.mockResolvedValue(mockTechnicians);
            const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
            const result = await service.getTechnicianPerformanceReport(dateRange);
            expect(result.totalTechnicians).toBe(2);
            expect(result.technicians).toHaveLength(2);
            expect(result.topPerformers.length).toBeLessThanOrEqual(5);
        });
        it('should calculate correct metrics for individual technician', async () => {
            prisma.technician.findMany.mockResolvedValue(mockTechnicians);
            const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
            const result = await service.getTechnicianPerformanceReport(dateRange);
            const johnDoe = result.technicians.find(t => t.technicianName === 'John Doe');
            expect(johnDoe).toBeDefined();
            expect(johnDoe?.totalJobs).toBe(3);
            expect(johnDoe?.completedJobs).toBe(2);
            expect(johnDoe?.completionRate).toBeCloseTo(66.67, 1);
            expect(johnDoe?.totalRevenue).toBe(350);
        });
        it('should calculate on-time rate correctly', async () => {
            prisma.technician.findMany.mockResolvedValue(mockTechnicians);
            const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
            const result = await service.getTechnicianPerformanceReport(dateRange);
            const johnDoe = result.technicians.find(t => t.technicianName === 'John Doe');
            expect(johnDoe?.onTimeRate).toBe(100);
            const janeSmith = result.technicians.find(t => t.technicianName === 'Jane Smith');
            expect(janeSmith?.onTimeRate).toBe(0);
        });
        it('should calculate average job duration', async () => {
            prisma.technician.findMany.mockResolvedValue(mockTechnicians);
            const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
            const result = await service.getTechnicianPerformanceReport(dateRange);
            const johnDoe = result.technicians.find(t => t.technicianName === 'John Doe');
            expect(johnDoe?.averageJobDuration).toBe(75);
        });
        it('should handle empty technicians', async () => {
            prisma.technician.findMany.mockResolvedValue([]);
            const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
            const result = await service.getTechnicianPerformanceReport(dateRange);
            expect(result.totalTechnicians).toBe(0);
            expect(result.averageCompletionRate).toBe(0);
            expect(result.technicians).toHaveLength(0);
        });
    });
    describe('getCustomerAnalytics', () => {
        it('should return customer analytics summary', async () => {
            prisma.customer.findMany.mockResolvedValue(mockCustomers);
            const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
            const result = await service.getCustomerAnalytics(dateRange);
            expect(result.totalCustomers).toBe(3);
            expect(result.activeCustomers).toBe(2);
            expect(result.newCustomersInPeriod).toBe(1);
        });
        it('should identify repeat customers', async () => {
            prisma.customer.findMany.mockResolvedValue(mockCustomers);
            const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
            const result = await service.getCustomerAnalytics(dateRange);
            expect(result.repeatCustomers).toBe(1);
        });
        it('should calculate top customers by revenue', async () => {
            prisma.customer.findMany.mockResolvedValue(mockCustomers);
            const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
            const result = await service.getCustomerAnalytics(dateRange);
            expect(result.topCustomers).toBeDefined();
            expect(result.topCustomers.length).toBeGreaterThan(0);
            expect(result.topCustomers[0].customerName).toBe('Acme Corp');
            expect(result.topCustomers[0].totalRevenue).toBe(350);
        });
        it('should calculate estimate conversion rate per customer', async () => {
            prisma.customer.findMany.mockResolvedValue(mockCustomers);
            const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
            const result = await service.getCustomerAnalytics(dateRange);
            const acmeCorp = result.topCustomers.find(c => c.customerName === 'Acme Corp');
            expect(acmeCorp?.estimateConversionRate).toBe(50);
        });
        it('should handle customers with no jobs', async () => {
            prisma.customer.findMany.mockResolvedValue(mockCustomers);
            const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
            const result = await service.getCustomerAnalytics(dateRange);
            const inactiveCustomer = result.topCustomers.find(c => c.customerName === 'Inactive Customer');
            expect(inactiveCustomer).toBeUndefined();
        });
    });
    describe('getDashboardSummary', () => {
        beforeEach(() => {
            prisma.invoice.findMany.mockResolvedValue(mockInvoices);
            prisma.job.findMany.mockResolvedValue(mockJobs);
            prisma.customer.findMany.mockResolvedValue(mockCustomers);
            prisma.estimate.findMany.mockResolvedValue(mockEstimates);
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
            expect(result.customers.active).toBe(2);
        });
        it('should calculate estimate metrics', async () => {
            const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
            const result = await service.getDashboardSummary(dateRange);
            expect(result.estimates.total).toBe(4);
            expect(result.estimates.pending).toBe(1);
            expect(result.estimates.conversionRate).toBeCloseTo(66.67, 1);
        });
        it('should calculate revenue growth', async () => {
            const previousInvoices = [
                { id: 'prev-1', status: client_1.InvoiceStatus.PAID, total: new library_1.Decimal(100.0) },
            ];
            prisma.invoice.findMany
                .mockResolvedValueOnce(mockInvoices)
                .mockResolvedValueOnce(previousInvoices);
            const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
            const result = await service.getDashboardSummary(dateRange);
            expect(result.revenue.growth).toBe(250);
        });
        it('should handle zero previous revenue', async () => {
            prisma.invoice.findMany
                .mockResolvedValueOnce(mockInvoices)
                .mockResolvedValueOnce([]);
            const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
            const result = await service.getDashboardSummary(dateRange);
            expect(result.revenue.growth).toBe(100);
        });
    });
    describe('workspace context validation', () => {
        it('should throw BadRequestException when workspace is not set', async () => {
            workspaceContext.getWorkspaceId.mockReturnValue(null);
            const dateRange = { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') };
            await expect(service.getRevenueReport(dateRange)).rejects.toThrow(common_1.BadRequestException);
            await expect(service.getTechnicianPerformanceReport(dateRange)).rejects.toThrow(common_1.BadRequestException);
            await expect(service.getCustomerAnalytics(dateRange)).rejects.toThrow(common_1.BadRequestException);
            await expect(service.getDashboardSummary(dateRange)).rejects.toThrow(common_1.BadRequestException);
        });
    });
});

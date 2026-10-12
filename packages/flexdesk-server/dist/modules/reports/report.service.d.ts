import { type PrismaService } from '@/core/database/prisma.service';
export interface DateRange {
    startDate: Date;
    endDate: Date;
}
export interface RevenueReportSummary {
    totalRevenue: number;
    paidInvoices: number;
    pendingRevenue: number;
    pendingInvoices: number;
    overdueRevenue: number;
    overdueInvoices: number;
    averageInvoiceValue: number;
    revenueByMonth: MonthlyRevenue[];
    revenueByServiceType: ServiceTypeRevenue[];
}
export interface MonthlyRevenue {
    month: string;
    revenue: number;
    invoiceCount: number;
}
export interface ServiceTypeRevenue {
    serviceType: string;
    revenue: number;
    percentage: number;
}
export interface TechnicianPerformanceReport {
    technicianId: string;
    technicianName: string;
    totalJobs: number;
    completedJobs: number;
    completionRate: number;
    averageJobDuration: number;
    totalRevenue: number;
    averageRevenuePerJob: number;
    onTimeRate: number;
    customerRating?: number;
}
export interface TechnicianPerformanceSummary {
    totalTechnicians: number;
    averageCompletionRate: number;
    averageJobDuration: number;
    topPerformers: TechnicianPerformanceReport[];
    technicians: TechnicianPerformanceReport[];
}
export interface CustomerAnalyticsSummary {
    totalCustomers: number;
    newCustomersInPeriod: number;
    activeCustomers: number;
    repeatCustomers: number;
    averageJobsPerCustomer: number;
    averageRevenuePerCustomer: number;
    topCustomers: CustomerMetrics[];
    customersByMonth: MonthlyCustomerMetrics[];
}
export interface CustomerMetrics {
    customerId: string;
    customerName: string;
    totalJobs: number;
    totalRevenue: number;
    lastJobDate: Date | null;
    firstJobDate: Date | null;
    estimateConversionRate: number;
}
export interface MonthlyCustomerMetrics {
    month: string;
    newCustomers: number;
    activeCustomers: number;
    totalJobs: number;
}
export interface DashboardSummary {
    revenue: {
        total: number;
        pending: number;
        overdue: number;
        growth: number;
    };
    jobs: {
        total: number;
        completed: number;
        inProgress: number;
        scheduled: number;
        completionRate: number;
    };
    customers: {
        total: number;
        new: number;
        active: number;
    };
    estimates: {
        total: number;
        pending: number;
        conversionRate: number;
    };
}
export declare class ReportService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getWorkspaceIdOrThrow;
    getRevenueReport(dateRange: DateRange): Promise<RevenueReportSummary>;
    private calculateRevenueByMonth;
    private calculateRevenueByServiceType;
    private extractServiceType;
    getTechnicianPerformanceReport(dateRange: DateRange): Promise<TechnicianPerformanceSummary>;
    getCustomerAnalytics(dateRange: DateRange): Promise<CustomerAnalyticsSummary>;
    private calculateCustomersByMonth;
    getDashboardSummary(dateRange: DateRange): Promise<DashboardSummary>;
    private formatMonth;
    validateDateRange(startDate: string, endDate: string): DateRange;
}

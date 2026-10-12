import { type ReportService, type RevenueReportSummary, type TechnicianPerformanceSummary, type CustomerAnalyticsSummary, type DashboardSummary } from './report.service';
export declare class ReportController {
    private readonly reportService;
    constructor(reportService: ReportService);
    getDashboardSummary(startDate: string, endDate: string): Promise<DashboardSummary>;
    getRevenueReport(startDate: string, endDate: string): Promise<RevenueReportSummary>;
    getTechnicianPerformanceReport(startDate: string, endDate: string): Promise<TechnicianPerformanceSummary>;
    getCustomerAnalytics(startDate: string, endDate: string): Promise<CustomerAnalyticsSummary>;
    private validateRequiredDateParams;
}

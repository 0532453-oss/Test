"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const workspace_context_1 = require("../../core/database/workspace-context");
let ReportService = class ReportService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    getWorkspaceIdOrThrow() {
        const workspaceId = (0, workspace_context_1.getWorkspaceId)();
        if (!workspaceId) {
            throw new common_1.BadRequestException('Workspace context is required');
        }
        return workspaceId;
    }
    async getRevenueReport(dateRange) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const { startDate, endDate } = dateRange;
        const invoices = await this.prisma.invoice.findMany({
            where: {
                workspaceId,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                lineItems: true,
            },
        });
        const paidInvoices = invoices.filter(i => i.status === client_1.InvoiceStatus.PAID);
        const pendingInvoices = invoices.filter(i => i.status === client_1.InvoiceStatus.SENT || i.status === client_1.InvoiceStatus.DRAFT);
        const overdueInvoices = invoices.filter(i => i.status === client_1.InvoiceStatus.OVERDUE);
        const totalRevenue = paidInvoices.reduce((sum, i) => sum + parseFloat(i.total.toString()), 0);
        const pendingRevenue = pendingInvoices.reduce((sum, i) => sum + parseFloat(i.total.toString()), 0);
        const overdueRevenue = overdueInvoices.reduce((sum, i) => sum + parseFloat(i.total.toString()), 0);
        const averageInvoiceValue = paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0;
        const revenueByMonth = this.calculateRevenueByMonth(paidInvoices);
        const revenueByServiceType = this.calculateRevenueByServiceType(paidInvoices);
        return {
            totalRevenue,
            paidInvoices: paidInvoices.length,
            pendingRevenue,
            pendingInvoices: pendingInvoices.length,
            overdueRevenue,
            overdueInvoices: overdueInvoices.length,
            averageInvoiceValue,
            revenueByMonth,
            revenueByServiceType,
        };
    }
    calculateRevenueByMonth(invoices) {
        const monthlyMap = new Map();
        for (const invoice of invoices) {
            if (invoice.paidAt) {
                const month = this.formatMonth(invoice.paidAt);
                const existing = monthlyMap.get(month) || { revenue: 0, count: 0 };
                existing.revenue += parseFloat(invoice.total.toString());
                existing.count += 1;
                monthlyMap.set(month, existing);
            }
        }
        return Array.from(monthlyMap.entries())
            .map(([month, data]) => ({
            month,
            revenue: data.revenue,
            invoiceCount: data.count,
        }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }
    calculateRevenueByServiceType(invoices) {
        const serviceTypeMap = new Map();
        let totalRevenue = 0;
        for (const invoice of invoices) {
            for (const item of invoice.lineItems) {
                const serviceType = this.extractServiceType(item.description);
                const amount = parseFloat(item.total.toString());
                serviceTypeMap.set(serviceType, (serviceTypeMap.get(serviceType) || 0) + amount);
                totalRevenue += amount;
            }
        }
        return Array.from(serviceTypeMap.entries())
            .map(([serviceType, revenue]) => ({
            serviceType,
            revenue,
            percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
        }))
            .sort((a, b) => b.revenue - a.revenue);
    }
    extractServiceType(description) {
        const lower = description.toLowerCase();
        if (lower.includes('labor') || lower.includes('service'))
            return 'Labor';
        if (lower.includes('part') || lower.includes('material'))
            return 'Parts';
        if (lower.includes('emergency') || lower.includes('urgent'))
            return 'Emergency';
        if (lower.includes('maintenance'))
            return 'Maintenance';
        return 'General Service';
    }
    async getTechnicianPerformanceReport(dateRange) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const { startDate, endDate } = dateRange;
        const technicians = await this.prisma.technician.findMany({
            where: { workspaceId },
            include: {
                user: true,
                jobs: {
                    where: {
                        createdAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    include: {
                        invoice: true,
                    },
                },
            },
        });
        const technicianReports = technicians.map(tech => {
            const jobs = tech.jobs;
            const completedJobs = jobs.filter(j => j.status === client_1.JobStatus.COMPLETED);
            const onTimeJobs = completedJobs.filter(j => {
                if (!j.scheduledAt || !j.completedAt)
                    return true;
                const scheduled = new Date(j.scheduledAt);
                const completed = new Date(j.completedAt);
                const scheduledEnd = new Date(scheduled.getTime() + (j.estimatedDuration || 60) * 60 * 1000);
                return completed <= scheduledEnd;
            });
            const durationsMinutes = completedJobs
                .filter(j => j.startedAt && j.completedAt)
                .map(j => {
                const start = new Date(j.startedAt);
                const end = new Date(j.completedAt);
                return (end.getTime() - start.getTime()) / (1000 * 60);
            });
            const avgDuration = durationsMinutes.length > 0
                ? durationsMinutes.reduce((a, b) => a + b, 0) / durationsMinutes.length
                : 0;
            const totalRevenue = completedJobs.reduce((sum, job) => {
                if (job.invoice && job.invoice.status === client_1.InvoiceStatus.PAID) {
                    return sum + parseFloat(job.invoice.total.toString());
                }
                return sum;
            }, 0);
            const techName = tech.user
                ? `${tech.user.firstName || ''} ${tech.user.lastName || ''}`.trim() || tech.user.email
                : 'Unknown';
            return {
                technicianId: tech.id,
                technicianName: techName,
                totalJobs: jobs.length,
                completedJobs: completedJobs.length,
                completionRate: jobs.length > 0 ? (completedJobs.length / jobs.length) * 100 : 0,
                averageJobDuration: avgDuration,
                totalRevenue,
                averageRevenuePerJob: completedJobs.length > 0 ? totalRevenue / completedJobs.length : 0,
                onTimeRate: completedJobs.length > 0
                    ? (onTimeJobs.length / completedJobs.length) * 100
                    : 0,
            };
        });
        const totalTechnicians = technicianReports.length;
        const averageCompletionRate = totalTechnicians > 0
            ? technicianReports.reduce((sum, t) => sum + t.completionRate, 0) / totalTechnicians
            : 0;
        const averageJobDuration = totalTechnicians > 0
            ? technicianReports.reduce((sum, t) => sum + t.averageJobDuration, 0) /
                totalTechnicians
            : 0;
        const topPerformers = [...technicianReports]
            .sort((a, b) => {
            const rateCompare = b.completionRate - a.completionRate;
            if (Math.abs(rateCompare) < 5) {
                return b.totalRevenue - a.totalRevenue;
            }
            return rateCompare;
        })
            .slice(0, 5);
        return {
            totalTechnicians,
            averageCompletionRate,
            averageJobDuration,
            topPerformers,
            technicians: technicianReports,
        };
    }
    async getCustomerAnalytics(dateRange) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const { startDate, endDate } = dateRange;
        const customers = await this.prisma.customer.findMany({
            where: { workspaceId },
            include: {
                jobs: {
                    where: {
                        createdAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    include: {
                        invoice: true,
                    },
                },
                estimates: {
                    where: {
                        createdAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                },
            },
        });
        const newCustomers = customers.filter(c => c.createdAt >= startDate && c.createdAt <= endDate);
        const activeCustomers = customers.filter(c => c.jobs.length > 0);
        const repeatCustomers = customers.filter(c => c.jobs.length >= 2);
        const customerMetrics = activeCustomers.map(customer => {
            const completedJobs = customer.jobs.filter(j => j.status === client_1.JobStatus.COMPLETED);
            const totalRevenue = completedJobs.reduce((sum, job) => {
                if (job.invoice && job.invoice.status === client_1.InvoiceStatus.PAID) {
                    return sum + parseFloat(job.invoice.total.toString());
                }
                return sum;
            }, 0);
            const sentEstimates = customer.estimates.filter(e => e.status !== client_1.EstimateStatus.DRAFT);
            const convertedEstimates = customer.estimates.filter(e => e.status === client_1.EstimateStatus.CONVERTED || e.status === client_1.EstimateStatus.ACCEPTED);
            const conversionRate = sentEstimates.length > 0
                ? (convertedEstimates.length / sentEstimates.length) * 100
                : 0;
            const jobDates = customer.jobs
                .map(j => new Date(j.createdAt))
                .sort((a, b) => a.getTime() - b.getTime());
            return {
                customerId: customer.id,
                customerName: customer.name,
                totalJobs: customer.jobs.length,
                totalRevenue,
                lastJobDate: jobDates.length > 0 ? jobDates[jobDates.length - 1] : null,
                firstJobDate: jobDates.length > 0 ? jobDates[0] : null,
                estimateConversionRate: conversionRate,
            };
        });
        const topCustomers = [...customerMetrics]
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 10);
        const customersByMonth = this.calculateCustomersByMonth(customers, startDate, endDate);
        const totalJobs = customers.reduce((sum, c) => sum + c.jobs.length, 0);
        const totalRevenue = customerMetrics.reduce((sum, c) => sum + c.totalRevenue, 0);
        const avgJobsPerCustomer = activeCustomers.length > 0 ? totalJobs / activeCustomers.length : 0;
        const avgRevenuePerCustomer = activeCustomers.length > 0 ? totalRevenue / activeCustomers.length : 0;
        return {
            totalCustomers: customers.length,
            newCustomersInPeriod: newCustomers.length,
            activeCustomers: activeCustomers.length,
            repeatCustomers: repeatCustomers.length,
            averageJobsPerCustomer: avgJobsPerCustomer,
            averageRevenuePerCustomer: avgRevenuePerCustomer,
            topCustomers,
            customersByMonth,
        };
    }
    calculateCustomersByMonth(customers, startDate, endDate) {
        const monthlyMap = new Map();
        const current = new Date(startDate);
        while (current <= endDate) {
            const month = this.formatMonth(current);
            monthlyMap.set(month, {
                newCustomers: 0,
                activeCustomers: new Set(),
                totalJobs: 0,
            });
            current.setMonth(current.getMonth() + 1);
        }
        for (const customer of customers) {
            const customerMonth = this.formatMonth(customer.createdAt);
            const entry = monthlyMap.get(customerMonth);
            if (entry) {
                entry.newCustomers += 1;
            }
            for (const job of customer.jobs) {
                const jobMonth = this.formatMonth(job.createdAt);
                const monthEntry = monthlyMap.get(jobMonth);
                if (monthEntry) {
                    monthEntry.activeCustomers.add(customer.id);
                    monthEntry.totalJobs += 1;
                }
            }
        }
        return Array.from(monthlyMap.entries())
            .map(([month, data]) => ({
            month,
            newCustomers: data.newCustomers,
            activeCustomers: data.activeCustomers.size,
            totalJobs: data.totalJobs,
        }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }
    async getDashboardSummary(dateRange) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const { startDate, endDate } = dateRange;
        const periodDuration = endDate.getTime() - startDate.getTime();
        const previousStartDate = new Date(startDate.getTime() - periodDuration);
        const previousEndDate = new Date(startDate.getTime() - 1);
        const [invoices, jobs, customers, estimates] = await Promise.all([
            this.prisma.invoice.findMany({
                where: {
                    workspaceId,
                    createdAt: { gte: startDate, lte: endDate },
                },
            }),
            this.prisma.job.findMany({
                where: {
                    workspaceId,
                    createdAt: { gte: startDate, lte: endDate },
                },
            }),
            this.prisma.customer.findMany({
                where: {
                    workspaceId,
                },
            }),
            this.prisma.estimate.findMany({
                where: {
                    workspaceId,
                    createdAt: { gte: startDate, lte: endDate },
                },
            }),
        ]);
        const previousInvoices = await this.prisma.invoice.findMany({
            where: {
                workspaceId,
                createdAt: { gte: previousStartDate, lte: previousEndDate },
                status: client_1.InvoiceStatus.PAID,
            },
        });
        const paidInvoices = invoices.filter(i => i.status === client_1.InvoiceStatus.PAID);
        const pendingInvoices = invoices.filter(i => i.status === client_1.InvoiceStatus.SENT || i.status === client_1.InvoiceStatus.DRAFT);
        const overdueInvoices = invoices.filter(i => i.status === client_1.InvoiceStatus.OVERDUE);
        const totalRevenue = paidInvoices.reduce((sum, i) => sum + parseFloat(i.total.toString()), 0);
        const pendingRevenue = pendingInvoices.reduce((sum, i) => sum + parseFloat(i.total.toString()), 0);
        const overdueRevenue = overdueInvoices.reduce((sum, i) => sum + parseFloat(i.total.toString()), 0);
        const previousRevenue = previousInvoices.reduce((sum, i) => sum + parseFloat(i.total.toString()), 0);
        const revenueGrowth = previousRevenue > 0
            ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
            : totalRevenue > 0
                ? 100
                : 0;
        const completedJobs = jobs.filter(j => j.status === client_1.JobStatus.COMPLETED);
        const inProgressJobs = jobs.filter(j => j.status === client_1.JobStatus.IN_PROGRESS || j.status === client_1.JobStatus.DISPATCHED);
        const scheduledJobs = jobs.filter(j => j.status === client_1.JobStatus.SCHEDULED);
        const completionRate = jobs.length > 0 ? (completedJobs.length / jobs.length) * 100 : 0;
        const newCustomers = customers.filter(c => c.createdAt >= startDate && c.createdAt <= endDate);
        const activeCustomerIds = new Set(jobs.map(j => j.customerId));
        const sentEstimates = estimates.filter(e => e.status !== client_1.EstimateStatus.DRAFT);
        const convertedEstimates = estimates.filter(e => e.status === client_1.EstimateStatus.CONVERTED || e.status === client_1.EstimateStatus.ACCEPTED);
        const pendingEstimates = estimates.filter(e => e.status === client_1.EstimateStatus.SENT || e.status === client_1.EstimateStatus.VIEWED);
        const estimateConversionRate = sentEstimates.length > 0
            ? (convertedEstimates.length / sentEstimates.length) * 100
            : 0;
        return {
            revenue: {
                total: totalRevenue,
                pending: pendingRevenue,
                overdue: overdueRevenue,
                growth: revenueGrowth,
            },
            jobs: {
                total: jobs.length,
                completed: completedJobs.length,
                inProgress: inProgressJobs.length,
                scheduled: scheduledJobs.length,
                completionRate,
            },
            customers: {
                total: customers.length,
                new: newCustomers.length,
                active: activeCustomerIds.size,
            },
            estimates: {
                total: estimates.length,
                pending: pendingEstimates.length,
                conversionRate: estimateConversionRate,
            },
        };
    }
    formatMonth(date) {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    validateDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime())) {
            throw new common_1.BadRequestException('Invalid start date');
        }
        if (isNaN(end.getTime())) {
            throw new common_1.BadRequestException('Invalid end date');
        }
        if (start > end) {
            throw new common_1.BadRequestException('Start date must be before end date');
        }
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return { startDate: start, endDate: end };
    }
};
exports.ReportService = ReportService;
exports.ReportService = ReportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function])
], ReportService);

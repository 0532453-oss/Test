import { Injectable, BadRequestException } from '@nestjs/common';
import { JobStatus, InvoiceStatus, EstimateStatus } from '@prisma/client';

import { PrismaService } from '@/core/database/prisma.service';
import { getWorkspaceId } from '@/core/database/workspace-context';

// ============= Report Interfaces =============

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Revenue Report Types
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
  month: string; // YYYY-MM
  revenue: number;
  invoiceCount: number;
}

export interface ServiceTypeRevenue {
  serviceType: string;
  revenue: number;
  percentage: number;
}

// Technician Performance Types
export interface TechnicianPerformanceReport {
  technicianId: string;
  technicianName: string;
  totalJobs: number;
  completedJobs: number;
  completionRate: number;
  averageJobDuration: number; // minutes
  totalRevenue: number;
  averageRevenuePerJob: number;
  onTimeRate: number; // % of jobs completed on or before scheduled time
  customerRating?: number; // future: when ratings are added
}

export interface TechnicianPerformanceSummary {
  totalTechnicians: number;
  averageCompletionRate: number;
  averageJobDuration: number;
  topPerformers: TechnicianPerformanceReport[];
  technicians: TechnicianPerformanceReport[];
}

// Customer Analytics Types
export interface CustomerAnalyticsSummary {
  totalCustomers: number;
  newCustomersInPeriod: number;
  activeCustomers: number; // had jobs in period
  repeatCustomers: number; // had 2+ jobs
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
  month: string; // YYYY-MM
  newCustomers: number;
  activeCustomers: number;
  totalJobs: number;
}

// Dashboard Summary
export interface DashboardSummary {
  revenue: {
    total: number;
    pending: number;
    overdue: number;
    growth: number; // % vs previous period
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

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  private getWorkspaceIdOrThrow(): string {
    const workspaceId = getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Workspace context is required');
    }
    return workspaceId;
  }

  // ============= Revenue Reports =============

  async getRevenueReport(dateRange: DateRange): Promise<RevenueReportSummary> {
    const workspaceId = this.getWorkspaceIdOrThrow();
    const { startDate, endDate } = dateRange;

    // Get all invoices in date range
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

    // Calculate revenue metrics
    const paidInvoices = invoices.filter(i => i.status === InvoiceStatus.PAID);
    const pendingInvoices = invoices.filter(
      i => i.status === InvoiceStatus.SENT || i.status === InvoiceStatus.DRAFT,
    );
    const overdueInvoices = invoices.filter(i => i.status === InvoiceStatus.OVERDUE);

    const totalRevenue = paidInvoices.reduce(
      (sum, i) => sum + parseFloat(i.total.toString()),
      0,
    );
    const pendingRevenue = pendingInvoices.reduce(
      (sum, i) => sum + parseFloat(i.total.toString()),
      0,
    );
    const overdueRevenue = overdueInvoices.reduce(
      (sum, i) => sum + parseFloat(i.total.toString()),
      0,
    );

    const averageInvoiceValue =
      paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0;

    // Revenue by month
    const revenueByMonth = this.calculateRevenueByMonth(paidInvoices);

    // Revenue by service type (from line items)
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

  private calculateRevenueByMonth(
    invoices: Array<{ paidAt: Date | null; total: unknown }>,
  ): MonthlyRevenue[] {
    const monthlyMap = new Map<string, { revenue: number; count: number }>();

    for (const invoice of invoices) {
      if (invoice.paidAt) {
        const month = this.formatMonth(invoice.paidAt);
        const existing = monthlyMap.get(month) || { revenue: 0, count: 0 };
        existing.revenue += parseFloat(invoice.total!.toString());
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

  private calculateRevenueByServiceType(
    invoices: Array<{ lineItems: Array<{ description: string; total: { toString(): string } }> }>,
  ): ServiceTypeRevenue[] {
    const serviceTypeMap = new Map<string, number>();
    let totalRevenue = 0;

    for (const invoice of invoices) {
      for (const item of invoice.lineItems) {
        // Extract service type from description or default to 'Labor'
        const serviceType = this.extractServiceType(item.description);
        const amount = parseFloat(item.total.toString());
        serviceTypeMap.set(
          serviceType,
          (serviceTypeMap.get(serviceType) || 0) + amount,
        );
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

  private extractServiceType(description: string): string {
    // Simple extraction based on common keywords
    const lower = description.toLowerCase();
    if (lower.includes('labor') || lower.includes('service')) return 'Labor';
    if (lower.includes('part') || lower.includes('material')) return 'Parts';
    if (lower.includes('emergency') || lower.includes('urgent')) return 'Emergency';
    if (lower.includes('maintenance')) return 'Maintenance';
    return 'General Service';
  }

  // ============= Technician Performance Reports =============

  async getTechnicianPerformanceReport(
    dateRange: DateRange,
  ): Promise<TechnicianPerformanceSummary> {
    const workspaceId = this.getWorkspaceIdOrThrow();
    const { startDate, endDate } = dateRange;

    // Get all technicians with their jobs in date range
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

    const technicianReports: TechnicianPerformanceReport[] = technicians.map(tech => {
      const jobs = tech.jobs;
      const completedJobs = jobs.filter(j => j.status === JobStatus.COMPLETED);

      // Calculate on-time rate
      const onTimeJobs = completedJobs.filter(j => {
        if (!j.scheduledAt || !j.completedAt) return true; // assume on time if no schedule
        const scheduled = new Date(j.scheduledAt);
        const completed = new Date(j.completedAt);
        // Add estimated duration to scheduled time for comparison
        const scheduledEnd = new Date(
          scheduled.getTime() + (j.estimatedDuration || 60) * 60 * 1000,
        );
        return completed <= scheduledEnd;
      });

      // Calculate average job duration
      const durationsMinutes = completedJobs
        .filter(j => j.startedAt && j.completedAt)
        .map(j => {
          const start = new Date(j.startedAt!);
          const end = new Date(j.completedAt!);
          return (end.getTime() - start.getTime()) / (1000 * 60); // minutes
        });

      const avgDuration =
        durationsMinutes.length > 0
          ? durationsMinutes.reduce((a, b) => a + b, 0) / durationsMinutes.length
          : 0;

      // Calculate revenue from paid invoices
      const totalRevenue = completedJobs.reduce((sum, job) => {
        if (job.invoice && job.invoice.status === InvoiceStatus.PAID) {
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
        onTimeRate:
          completedJobs.length > 0
            ? (onTimeJobs.length / completedJobs.length) * 100
            : 0,
      };
    });

    // Calculate summary metrics
    const totalTechnicians = technicianReports.length;
    const averageCompletionRate =
      totalTechnicians > 0
        ? technicianReports.reduce((sum, t) => sum + t.completionRate, 0) / totalTechnicians
        : 0;
    const averageJobDuration =
      totalTechnicians > 0
        ? technicianReports.reduce((sum, t) => sum + t.averageJobDuration, 0) /
          totalTechnicians
        : 0;

    // Top performers by completion rate and revenue
    const topPerformers = [...technicianReports]
      .sort((a, b) => {
        // Primary sort by completion rate, secondary by revenue
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

  // ============= Customer Analytics =============

  async getCustomerAnalytics(
    dateRange: DateRange,
  ): Promise<CustomerAnalyticsSummary> {
    const workspaceId = this.getWorkspaceIdOrThrow();
    const { startDate, endDate } = dateRange;

    // Get all customers with their jobs and estimates in date range
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

    // Get new customers in period
    const newCustomers = customers.filter(
      c => c.createdAt >= startDate && c.createdAt <= endDate,
    );

    // Active customers (had at least one job in period)
    const activeCustomers = customers.filter(c => c.jobs.length > 0);

    // Repeat customers (had 2+ jobs overall)
    const repeatCustomers = customers.filter(c => c.jobs.length >= 2);

    // Calculate customer metrics
    const customerMetrics: CustomerMetrics[] = activeCustomers.map(customer => {
      const completedJobs = customer.jobs.filter(
        j => j.status === JobStatus.COMPLETED,
      );

      const totalRevenue = completedJobs.reduce((sum, job) => {
        if (job.invoice && job.invoice.status === InvoiceStatus.PAID) {
          return sum + parseFloat(job.invoice.total.toString());
        }
        return sum;
      }, 0);

      // Calculate estimate conversion rate
      const sentEstimates = customer.estimates.filter(
        e => e.status !== EstimateStatus.DRAFT,
      );
      const convertedEstimates = customer.estimates.filter(
        e => e.status === EstimateStatus.CONVERTED || e.status === EstimateStatus.ACCEPTED,
      );
      const conversionRate =
        sentEstimates.length > 0
          ? (convertedEstimates.length / sentEstimates.length) * 100
          : 0;

      // Get first and last job dates
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

    // Top customers by revenue
    const topCustomers = [...customerMetrics]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Customers by month
    const customersByMonth = this.calculateCustomersByMonth(
      customers,
      startDate,
      endDate,
    );

    // Calculate averages
    const totalJobs = customers.reduce((sum, c) => sum + c.jobs.length, 0);
    const totalRevenue = customerMetrics.reduce((sum, c) => sum + c.totalRevenue, 0);
    const avgJobsPerCustomer =
      activeCustomers.length > 0 ? totalJobs / activeCustomers.length : 0;
    const avgRevenuePerCustomer =
      activeCustomers.length > 0 ? totalRevenue / activeCustomers.length : 0;

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

  private calculateCustomersByMonth(
    customers: Array<{
      createdAt: Date;
      jobs: Array<{ createdAt: Date }>;
    }>,
    startDate: Date,
    endDate: Date,
  ): MonthlyCustomerMetrics[] {
    const monthlyMap = new Map<
      string,
      { newCustomers: number; activeCustomers: Set<string>; totalJobs: number }
    >();

    // Initialize all months in range
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

    // Count new customers by month
    for (const customer of customers) {
      const customerMonth = this.formatMonth(customer.createdAt);
      const entry = monthlyMap.get(customerMonth);
      if (entry) {
        entry.newCustomers += 1;
      }

      // Count active customers and jobs by month
      for (const job of customer.jobs) {
        const jobMonth = this.formatMonth(job.createdAt);
        const monthEntry = monthlyMap.get(jobMonth);
        if (monthEntry) {
          monthEntry.activeCustomers.add((customer as unknown as { id: string }).id);
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

  // ============= Dashboard Summary =============

  async getDashboardSummary(dateRange: DateRange): Promise<DashboardSummary> {
    const workspaceId = this.getWorkspaceIdOrThrow();
    const { startDate, endDate } = dateRange;

    // Calculate previous period for growth comparison
    const periodDuration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodDuration);
    const previousEndDate = new Date(startDate.getTime() - 1);

    // Current period data
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

    // Previous period revenue for growth calculation
    const previousInvoices = await this.prisma.invoice.findMany({
      where: {
        workspaceId,
        createdAt: { gte: previousStartDate, lte: previousEndDate },
        status: InvoiceStatus.PAID,
      },
    });

    // Calculate metrics
    const paidInvoices = invoices.filter(i => i.status === InvoiceStatus.PAID);
    const pendingInvoices = invoices.filter(
      i => i.status === InvoiceStatus.SENT || i.status === InvoiceStatus.DRAFT,
    );
    const overdueInvoices = invoices.filter(i => i.status === InvoiceStatus.OVERDUE);

    const totalRevenue = paidInvoices.reduce(
      (sum, i) => sum + parseFloat(i.total.toString()),
      0,
    );
    const pendingRevenue = pendingInvoices.reduce(
      (sum, i) => sum + parseFloat(i.total.toString()),
      0,
    );
    const overdueRevenue = overdueInvoices.reduce(
      (sum, i) => sum + parseFloat(i.total.toString()),
      0,
    );
    const previousRevenue = previousInvoices.reduce(
      (sum, i) => sum + parseFloat(i.total.toString()),
      0,
    );

    const revenueGrowth =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : totalRevenue > 0
          ? 100
          : 0;

    // Job metrics
    const completedJobs = jobs.filter(j => j.status === JobStatus.COMPLETED);
    const inProgressJobs = jobs.filter(
      j => j.status === JobStatus.IN_PROGRESS || j.status === JobStatus.DISPATCHED,
    );
    const scheduledJobs = jobs.filter(j => j.status === JobStatus.SCHEDULED);
    const completionRate =
      jobs.length > 0 ? (completedJobs.length / jobs.length) * 100 : 0;

    // Customer metrics
    const newCustomers = customers.filter(
      c => c.createdAt >= startDate && c.createdAt <= endDate,
    );
    const activeCustomerIds = new Set(jobs.map(j => j.customerId));

    // Estimate metrics
    const sentEstimates = estimates.filter(e => e.status !== EstimateStatus.DRAFT);
    const convertedEstimates = estimates.filter(
      e => e.status === EstimateStatus.CONVERTED || e.status === EstimateStatus.ACCEPTED,
    );
    const pendingEstimates = estimates.filter(
      e => e.status === EstimateStatus.SENT || e.status === EstimateStatus.VIEWED,
    );
    const estimateConversionRate =
      sentEstimates.length > 0
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

  // ============= Utility Methods =============

  private formatMonth(date: Date): string {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  validateDateRange(startDate: string, endDate: string): DateRange {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
      throw new BadRequestException('Invalid start date');
    }
    if (isNaN(end.getTime())) {
      throw new BadRequestException('Invalid end date');
    }
    if (start > end) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Set to start of day / end of day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { startDate: start, endDate: end };
  }
}

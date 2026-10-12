import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '@/core/database';
import { runWithWorkspace } from '@/core/database/workspace-context';
import { type WeeklyReportSnapshot } from '@/modules/reports/dto/weekly-report.dto';

/**
 * Report Generation Processor
 *
 * Handles scheduled report generation:
 * - Daily summary reports (11 PM daily)
 * - Weekly performance reports (Monday 6 AM)
 */
@Injectable()
export class ReportGenerationProcessor {
  private readonly logger = new Logger(ReportGenerationProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate daily summary report
   * Runs every day at 11 PM
   */
  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async generateDailySummary() {
    this.logger.log('Generating daily summary reports...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
      const workspaces = await this.prisma.workspace.findMany();

      for (const workspace of workspaces) {
        await runWithWorkspace(workspace.id, async () => {
          const [completedJobs, newCustomers, revenue] = await Promise.all([
            this.prisma.job.count({
              where: {
                completedAt: { gte: today, lt: tomorrow },
              },
            }),
            this.prisma.customer.count({
              where: {
                createdAt: { gte: today, lt: tomorrow },
              },
            }),
            this.prisma.invoice.aggregate({
              where: {
                paidAt: { gte: today, lt: tomorrow },
              },
              _sum: { total: true },
            }),
          ]);

          this.logger.log(
            `[Daily] Workspace ${workspace.id}: ${completedJobs} jobs, ${newCustomers} customers, $${revenue._sum.total || 0} revenue`,
          );
        });
      }
    } catch (error) {
      this.logger.error('Failed to generate daily summary', error);
    }
  }

  /**
   * Generate weekly performance report
   * Runs every Monday at 6 AM
   */
  @Cron(CronExpression.EVERY_WEEK)
  async generateWeeklyReport() {
    this.logger.log('Generating weekly performance reports...');

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    try {
      const workspaces = await this.prisma.workspace.findMany();

      for (const workspace of workspaces) {
        await runWithWorkspace(workspace.id, async () => {
          const report = await this.buildWeeklyReport(
            workspace.id,
            startDate,
            endDate,
          );

          this.logger.log(
            `[Weekly] Workspace ${workspace.id}: ` +
              `${report.jobs.completed} completed, ` +
              `$${report.revenue.collected} collected, ` +
              `${report.customers.newCustomers} new customers`,
          );

          // Log full report as structured JSON for debugging
          this.logger.debug(JSON.stringify(report));
        });
      }
    } catch (error) {
      this.logger.error('Failed to generate weekly report', error);
    }
  }

  private async buildWeeklyReport(
    workspaceId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<WeeklyReportSnapshot> {
    const [
      completedJobs,
      scheduledJobs,
      cancelledJobs,
      newCustomers,
      totalCustomers,
      invoicedRevenue,
      collectedRevenue,
      outstandingRevenue,
      technicianJobs,
    ] = await Promise.all([
      // Completed jobs
      this.prisma.job.count({
        where: {
          workspaceId,
          completedAt: { gte: startDate, lt: endDate },
        },
      }),
      // Scheduled jobs
      this.prisma.job.count({
        where: {
          workspaceId,
          status: 'SCHEDULED',
          createdAt: { gte: startDate, lt: endDate },
        },
      }),
      // Cancelled jobs
      this.prisma.job.count({
        where: {
          workspaceId,
          status: 'CANCELLED',
          updatedAt: { gte: startDate, lt: endDate },
        },
      }),
      // New customers
      this.prisma.customer.count({
        where: {
          workspaceId,
          createdAt: { gte: startDate, lt: endDate },
        },
      }),
      // Total active customers
      this.prisma.customer.count({
        where: { workspaceId },
      }),
      // Invoiced revenue
      this.prisma.invoice.aggregate({
        where: {
          workspaceId,
          createdAt: { gte: startDate, lt: endDate },
        },
        _sum: { total: true },
      }),
      // Collected revenue
      this.prisma.invoice.aggregate({
        where: {
          workspaceId,
          paidAt: { gte: startDate, lt: endDate },
        },
        _sum: { total: true },
      }),
      // Outstanding revenue
      this.prisma.invoice.aggregate({
        where: {
          workspaceId,
          status: 'SENT',
        },
        _sum: { total: true },
      }),
      // Jobs per technician
      this.prisma.job.groupBy({
        by: ['technicianId'],
        where: {
          workspaceId,
          completedAt: { gte: startDate, lt: endDate },
          technicianId: { not: null },
        },
        _count: true,
      }),
    ]);

    // Build technician stats
    const jobsPerTechnician: Record<string, number> = {};
    for (const entry of technicianJobs) {
      if (entry.technicianId) {
        jobsPerTechnician[entry.technicianId] = entry._count;
      }
    }

    const activeTechnicians = Object.keys(jobsPerTechnician).length;

    return {
      workspaceId,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      jobs: {
        completed: completedJobs,
        scheduled: scheduledJobs,
        cancelled: cancelledJobs,
        averageCompletionMinutes: 0, // Would need job duration data
      },
      revenue: {
        invoiced: Number(invoicedRevenue._sum.total || 0),
        collected: Number(collectedRevenue._sum.total || 0),
        outstanding: Number(outstandingRevenue._sum.total || 0),
      },
      customers: {
        newCustomers,
        totalActive: totalCustomers,
      },
      technicians: {
        totalActive: activeTechnicians,
        jobsPerTechnician,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}

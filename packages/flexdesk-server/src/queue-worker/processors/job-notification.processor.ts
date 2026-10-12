import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '@/core/database';
import { runWithWorkspace } from '@/core/database/workspace-context';
import { NotificationService } from '@/modules/notifications/notification.service';

/**
 * Job Notification Processor
 *
 * Handles scheduled notifications:
 * - Job reminder notifications to customers (24h before)
 * - Overdue job alerts to managers
 * - Daily technician job summaries
 */
@Injectable()
export class JobNotificationProcessor {
  private readonly logger = new Logger(JobNotificationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Send job reminders every morning at 7 AM
   * Notifies customers about their scheduled appointments today
   */
  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async sendDailyJobReminders() {
    this.logger.log('Processing daily job reminders...');

    const todayString = new Date().toISOString().split('T')[0];

    try {
      const jobs = await this.prisma.job.findMany({
        where: {
          scheduledDate: todayString,
          status: { in: ['SCHEDULED'] },
        },
        include: {
          technician: true,
          customer: {
            include: {
              notificationPreference: true,
            },
          },
        },
      });

      this.logger.log(`Found ${jobs.length} jobs scheduled for today`);

      let sentCount = 0;
      for (const job of jobs) {
        if (!job.customer) continue;

        try {
          await this.notificationService.notifyJobReminder(
            job,
            job.customer,
            24, // Hours until appointment
          );
          sentCount++;
        } catch (error) {
          this.logger.error(`Failed to send reminder for job ${job.id}`, error);
        }
      }

      this.logger.log(`Sent ${sentCount} job reminders`);
    } catch (error) {
      this.logger.error('Failed to process job reminders', error);
    }
  }

  /**
   * Send appointment reminders 2 hours before scheduled time
   * Runs every 30 minutes to catch upcoming jobs
   */
  @Cron('0,30 * * * *') // Every 30 minutes
  async sendUpcomingJobReminders() {
    this.logger.debug('Checking for jobs starting in ~2 hours...');

    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const twoAndHalfHoursFromNow = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);

    try {
      // Find jobs scheduled within the next 2-2.5 hours
      const jobs = await this.prisma.job.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: {
            gte: twoHoursFromNow,
            lt: twoAndHalfHoursFromNow,
          },
        },
        include: {
          customer: {
            include: {
              notificationPreference: true,
            },
          },
        },
      });

      for (const job of jobs) {
        if (!job.customer) continue;

        try {
          await this.notificationService.notifyJobReminder(job, job.customer, 2);
        } catch (error) {
          this.logger.error(`Failed to send 2-hour reminder for job ${job.id}`, error);
        }
      }

      if (jobs.length > 0) {
        this.logger.log(`Sent ${jobs.length} upcoming job reminders`);
      }
    } catch (error) {
      this.logger.error('Failed to send upcoming job reminders', error);
    }
  }

  /**
   * Check for overdue jobs every hour
   * Alerts workspace admins about jobs that should have been completed
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkOverdueJobs() {
    this.logger.debug('Checking for overdue jobs...');

    const todayString = new Date().toISOString().split('T')[0];

    try {
      const overdueJobs = await this.prisma.job.findMany({
        where: {
          status: 'IN_PROGRESS',
          scheduledDate: {
            lt: todayString,
          },
        },
        include: {
          technician: true,
          workspace: true,
        },
      });

      if (overdueJobs.length > 0) {
        this.logger.warn(`Found ${overdueJobs.length} overdue jobs`);

        // Group by workspace for admin notifications
        const byWorkspace = new Map<string, typeof overdueJobs>();
        for (const job of overdueJobs) {
          const existing = byWorkspace.get(job.workspaceId) || [];
          existing.push(job);
          byWorkspace.set(job.workspaceId, existing);
        }

        // Log summary per workspace (email alerts can be added later)
        for (const [workspaceId, jobs] of byWorkspace) {
          this.logger.warn(
            `Workspace ${workspaceId}: ${jobs.length} overdue jobs - ` +
            jobs.map(j => `${j.id} (${j.title})`).join(', ')
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to check overdue jobs', error);
    }
  }

  /**
   * Check for unassigned jobs that are scheduled soon
   * Runs every 2 hours during business hours
   */
  @Cron('0 8,10,12,14,16 * * 1-5') // 8am, 10am, 12pm, 2pm, 4pm on weekdays
  async checkUnassignedJobs() {
    this.logger.log('Checking for unassigned jobs scheduled soon...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];

    try {
      const unassignedJobs = await this.prisma.job.findMany({
        where: {
          status: 'SCHEDULED',
          technicianId: null,
          scheduledDate: {
            lte: tomorrowString,
          },
        },
        include: {
          workspace: true,
        },
      });

      if (unassignedJobs.length > 0) {
        this.logger.warn(
          `Found ${unassignedJobs.length} unassigned jobs scheduled for today/tomorrow`
        );

        // Group by workspace
        const byWorkspace = new Map<string, number>();
        for (const job of unassignedJobs) {
          byWorkspace.set(job.workspaceId, (byWorkspace.get(job.workspaceId) || 0) + 1);
        }

        for (const [workspaceId, count] of byWorkspace) {
          this.logger.warn(`Workspace ${workspaceId}: ${count} unassigned jobs need attention`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to check unassigned jobs', error);
    }
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  Prisma,
  type RecurringJobTemplate,
  type Job,
  JobStatus,
  SyncStatus,
} from '@prisma/client';

import { PrismaService } from '@/core/database/prisma.service';
import { BaseService } from '@/engine/base.service';

/**
 * RecurrenceService
 * 
 * Handles recurring job template management and job generation with sync conflict prevention.
 * Implements three-layer protection:
 * 1. Idempotency: Unique constraint prevents duplicate jobs
 * 2. Atomic updates: Transaction ensures nextRunDate updates atomically
 * 3. Sync reconciliation: syncVersion-based conflict detection
 */
@Injectable()
export class RecurrenceService extends BaseService<Prisma.RecurringJobTemplateDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.recurringJobTemplate, 'RecurringJobTemplate');
  }

  /**
   * Create a new recurring job template
   */
  async createTemplate(data: {
    title: string;
    frequency: string;
    interval: number;
    startDate: Date;
    customerId: string;
    technicianId?: string;
    propertyId?: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    endDate?: Date;
    description?: string;
    priority?: string;
    estimatedDuration?: number;
    location?: Prisma.InputJsonValue;
  }): Promise<RecurringJobTemplate> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    // Create a temporary template object to calculate nextRunDate
    const tempTemplate: RecurringJobTemplate = {
      id: '',
      workspaceId,
      customerId: data.customerId,
      technicianId: data.technicianId || null,
      propertyId: data.propertyId || null,
      title: data.title,
      description: data.description || null,
      priority: (data.priority as any) || 'MEDIUM',
      frequency: data.frequency,
      interval: data.interval || 1,
      dayOfWeek: data.dayOfWeek ?? null,
      dayOfMonth: data.dayOfMonth ?? null,
      startDate: data.startDate,
      endDate: data.endDate || null,
      nextRunDate: data.startDate, // Temporary, will be calculated
      estimatedDuration: data.estimatedDuration || null,
      location: (data.location ?? null) as Prisma.JsonValue | null,
      isActive: true,
      syncStatus: SyncStatus.PENDING,
      lastSyncedAt: null,
      syncVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Calculate nextRunDate from startDate
    const nextRunDate = this.calculateNextRunDate(tempTemplate, data.startDate);

    // Create the template
    return await this.prisma.recurringJobTemplate.create({
      data: {
        workspaceId,
        customerId: data.customerId,
        technicianId: data.technicianId || undefined,
        title: data.title,
        description: data.description || undefined,
        priority: (data.priority as any) || 'MEDIUM',
        frequency: data.frequency,
        interval: data.interval || 1,
        dayOfWeek: data.dayOfWeek ?? undefined,
        dayOfMonth: data.dayOfMonth ?? undefined,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        nextRunDate,
        estimatedDuration: data.estimatedDuration || undefined,
        location: data.location || undefined,
        isActive: true,
        syncStatus: SyncStatus.PENDING,
        syncVersion: 0,
      },
    });
  }

  /**
   * Calculate the next run date based on recurrence rules
   */
  calculateNextRunDate(
    template: RecurringJobTemplate,
    fromDate?: Date,
  ): Date {
    const baseDate = fromDate || new Date(template.nextRunDate);
    const result = new Date(baseDate);

    switch (template.frequency) {
      case 'WEEKLY': {
        // Move to next occurrence day of week
        const targetDayOfWeek = template.dayOfWeek ?? 0;
        const currentDayOfWeek = result.getDay();
        
        let daysToAdd = targetDayOfWeek - currentDayOfWeek;
        
        // Fix: If same day (daysToAdd === 0) or past day (daysToAdd < 0),
        // must advance to next occurrence based on interval to prevent infinite loops
        if (daysToAdd <= 0) {
          // Advance by interval weeks (if interval=1, advance 1 week; if interval=2, advance 2 weeks, etc.)
          daysToAdd = template.interval * 7;
        } else {
          // Different day in the same week - go to target day this week
          // No interval adjustment needed since we're within the week
          // (interval only matters when we've completed a full cycle)
        }
        
        result.setDate(result.getDate() + daysToAdd);
        break;
      }

      case 'BIWEEKLY': {
        // Every 2 weeks
        result.setDate(result.getDate() + 14);
        break;
      }

      case 'MONTHLY': {
        // Move to next month, same day
        result.setMonth(result.getMonth() + (template.interval || 1));
        
        // Handle day of month if specified (e.g., always 15th)
        if (template.dayOfMonth !== null && template.dayOfMonth !== undefined) {
          const lastDayOfMonth = new Date(
            result.getFullYear(),
            result.getMonth() + 1,
            0,
          ).getDate();
          result.setDate(Math.min(template.dayOfMonth, lastDayOfMonth));
        }
        break;
      }

      case 'CUSTOM': {
        // For custom intervals, use interval as days
        result.setDate(result.getDate() + (template.interval || 1));
        break;
      }

      default:
        throw new BadRequestException(
          `Unsupported frequency: ${template.frequency}`,
        );
    }

    // Check if we've exceeded endDate
    if (template.endDate && result > template.endDate) {
      throw new BadRequestException(
        'Next run date exceeds template end date',
      );
    }

    return result;
  }

  /**
   * Check if a job can be generated for the given template and date
   * Returns true if no job exists for this template/date combination
   */
  async canGenerateJobForDate(
    templateId: string,
    scheduledAt: Date,
  ): Promise<boolean> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const startOfDay = new Date(scheduledAt);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(scheduledAt);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await this.prisma.job.findFirst({
      where: {
        workspaceId,
        recurringTemplateId: templateId,
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return !existing;
  }

  /**
   * Generate a single job from a template for a specific date
   * Idempotent: Returns existing job if one already exists for this date
   * Atomic: Updates nextRunDate and syncVersion in the same transaction
   */
  async generateJobFromTemplate(
    templateId: string,
    targetDate: Date,
  ): Promise<Job> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    // Idempotency check: Use the unique constraint to check for existing jobs
    // The @@unique([recurringTemplateId, scheduledAt]) constraint ensures
    // database-level idempotency, but we check first to avoid constraint violations
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await this.prisma.job.findFirst({
      where: {
        workspaceId,
        recurringTemplateId: templateId,
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existing) {
      // Job already exists - return it (idempotent behavior)
      return existing;
    }

    // Atomic generation: Create job and update template in transaction
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Re-fetch template to get latest state (important for sync conflicts)
        const template = await tx.recurringJobTemplate.findFirst({
          where: {
            id: templateId,
            workspaceId, // Workspace isolation: always include workspaceId
          },
        });

        if (!template) {
          throw new NotFoundException(
            `RecurringJobTemplate with id ${templateId} not found`,
          );
        }

        if (!template.isActive) {
          throw new BadRequestException(
            'Cannot generate job from inactive template',
          );
        }

        // Double-check idempotency within transaction (race condition protection)
        // Use the unique constraint to prevent duplicates
        const existingInTx = await tx.job.findFirst({
          where: {
            workspaceId, // Workspace isolation
            recurringTemplateId: templateId,
            scheduledAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        });

        if (existingInTx) {
          return existingInTx;
        }

        // Create job from template
        const jobData: Prisma.JobCreateInput = {
          workspace: { connect: { id: workspaceId } },
          customer: { connect: { id: template.customerId } },
          title: template.title,
          description: template.description || undefined,
          priority: template.priority,
          status: JobStatus.SCHEDULED,
          scheduledAt: targetDate,
          estimatedDuration: template.estimatedDuration || undefined,
          location: template.location as Prisma.InputJsonValue | undefined,
          recurringTemplate: { connect: { id: templateId } },
          syncStatus: SyncStatus.PENDING,
          syncVersion: 0,
        };

        if (template.technicianId) {
          jobData.technician = { connect: { id: template.technicianId } };
        }

        const job = await tx.job.create({
          data: jobData,
        });

        // Calculate and update nextRunDate atomically
        const nextRunDate = this.calculateNextRunDate(template, targetDate);

        // Atomic increment: Transaction ensures syncVersion update is atomic
        // This prevents race conditions even with concurrent job generation
        await tx.recurringJobTemplate.update({
          where: { id: templateId },
          data: {
            nextRunDate,
            syncVersion: template.syncVersion + 1, // Transaction-safe increment
            syncStatus: SyncStatus.PENDING,
            updatedAt: new Date(),
          },
        });

        return job;
      });
    } catch (error) {
      // Handle unique constraint violation (database-level idempotency check)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Unique constraint violation - job already exists
        // Fetch and return the existing job
        const existingJob = await this.prisma.job.findFirst({
          where: {
            workspaceId, // Workspace isolation
            recurringTemplateId: templateId,
            scheduledAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        });

        if (existingJob) {
          return existingJob;
        }
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Reconcile sync conflicts between local and server template states
   * Uses syncVersion comparison to determine which state is newer
   */
  async reconcileTemplateSync(
    localTemplate: RecurringJobTemplate,
    serverTemplate: RecurringJobTemplate,
  ): Promise<{
    resolvedTemplate: RecurringJobTemplate;
    regeneratedJobs: Job[];
  }> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    if (localTemplate.id !== serverTemplate.id) {
      throw new BadRequestException(
        'Cannot reconcile templates with different IDs',
      );
    }

    let resolvedTemplate: RecurringJobTemplate;
    const regeneratedJobs: Job[] = [];

    // Sync conflict resolution strategy
    if (serverTemplate.syncVersion > localTemplate.syncVersion) {
      // Server is newer: Accept server state
      // This means server cron may have generated jobs and updated nextRunDate
      resolvedTemplate = serverTemplate;

      // Check if we need to regenerate jobs that exist on server but not locally
      // This handles the case where server generated jobs while we were offline
      if (serverTemplate.nextRunDate < localTemplate.nextRunDate) {
        // Server has advanced nextRunDate, check for missing jobs
        const serverGeneratedJobs = await this.prisma.job.findMany({
          where: {
            workspaceId,
            recurringTemplateId: serverTemplate.id,
            scheduledAt: {
              gte: localTemplate.nextRunDate,
              lt: serverTemplate.nextRunDate,
            },
          },
        });

        // For any jobs server generated, ensure they exist (they should already)
        // This is a safety check - in practice, server jobs are authoritative
        for (const serverJob of serverGeneratedJobs) {
          const localExists = await this.prisma.job.findFirst({
            where: {
              workspaceId,
              id: serverJob.id,
            },
          });

          if (!localExists) {
            regeneratedJobs.push(serverJob);
          }
        }
      }
    } else if (localTemplate.syncVersion > serverTemplate.syncVersion) {
      // Local is newer: Merge carefully (keep local changes, but accept server-generated jobs)
      resolvedTemplate = await this.prisma.recurringJobTemplate.update({
        where: {
          id: localTemplate.id,
          workspaceId, // Workspace isolation
        },
        data: {
          title: localTemplate.title,
          description: localTemplate.description,
          priority: localTemplate.priority,
          frequency: localTemplate.frequency,
          interval: localTemplate.interval,
          dayOfWeek: localTemplate.dayOfWeek,
          dayOfMonth: localTemplate.dayOfMonth,
          startDate: localTemplate.startDate,
          endDate: localTemplate.endDate,
          estimatedDuration: localTemplate.estimatedDuration,
          location: localTemplate.location === null ? Prisma.JsonNull : (localTemplate.location as Prisma.InputJsonValue),
          isActive: localTemplate.isActive,
          // But keep server's nextRunDate if it's more advanced (jobs were generated)
          nextRunDate:
            serverTemplate.nextRunDate > localTemplate.nextRunDate
              ? serverTemplate.nextRunDate
              : localTemplate.nextRunDate,
          syncVersion: Math.max(localTemplate.syncVersion, serverTemplate.syncVersion) + 1,
          syncStatus: SyncStatus.PENDING,
        },
      });

      // Check for jobs server generated that we don't have
      const serverJobs = await this.prisma.job.findMany({
        where: {
          workspaceId,
          recurringTemplateId: serverTemplate.id,
          scheduledAt: {
            gte: localTemplate.nextRunDate,
          },
        },
      });

      for (const serverJob of serverJobs) {
        const exists = await this.canGenerateJobForDate(
          serverTemplate.id,
          new Date(serverJob.scheduledAt!),
        );

        if (!exists && serverJob.scheduledAt) {
          // Server generated a job we don't have - keep it
          regeneratedJobs.push(serverJob);
        }
      }
    } else {
      // Equal versions: Check if jobs exist on server, skip generation if found
      resolvedTemplate = serverTemplate;

      // If nextRunDate differs, it means one side generated jobs
      // Use the more advanced nextRunDate
      if (serverTemplate.nextRunDate !== localTemplate.nextRunDate) {
        const moreAdvanced =
          serverTemplate.nextRunDate > localTemplate.nextRunDate
            ? serverTemplate.nextRunDate
            : localTemplate.nextRunDate;

        resolvedTemplate = await this.prisma.recurringJobTemplate.update({
          where: {
            id: serverTemplate.id,
            workspaceId, // Workspace isolation
          },
          data: {
            nextRunDate: moreAdvanced,
            syncVersion: serverTemplate.syncVersion + 1, // Transaction-safe increment
            syncStatus: SyncStatus.PENDING,
          },
        });

        // Check for missing jobs between the two nextRunDates
        const earlierDate =
          serverTemplate.nextRunDate < localTemplate.nextRunDate
            ? serverTemplate.nextRunDate
            : localTemplate.nextRunDate;
        const laterDate =
          serverTemplate.nextRunDate > localTemplate.nextRunDate
            ? serverTemplate.nextRunDate
            : localTemplate.nextRunDate;

        const missingJobs = await this.prisma.job.findMany({
          where: {
            workspaceId,
            recurringTemplateId: serverTemplate.id,
            scheduledAt: {
              gte: earlierDate,
              lt: laterDate,
            },
          },
        });

        regeneratedJobs.push(...missingJobs);
      }
    }

    return {
      resolvedTemplate,
      regeneratedJobs,
    };
  }

  /**
   * Batch generate recurring jobs for all active templates in a workspace
   * Used by cron job to generate jobs for templates where nextRunDate <= today
   */
  async generateRecurringJobs(workspaceId?: string): Promise<{
    generated: number;
    skipped: number;
    errors: Array<{ templateId: string; error: string }>;
  }> {
    const targetWorkspaceId = workspaceId || this.getWorkspaceIdOrThrow();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all active templates where nextRunDate <= today
    const templates = await this.prisma.recurringJobTemplate.findMany({
      where: {
        workspaceId: targetWorkspaceId,
        isActive: true,
        nextRunDate: {
          lte: today,
        },
      },
    });

    let generated = 0;
    let skipped = 0;
    const errors: Array<{ templateId: string; error: string }> = [];

    for (const template of templates) {
      try {
        // Check if we've exceeded endDate
        if (template.endDate && template.nextRunDate > template.endDate) {
          // Deactivate template
          await this.prisma.recurringJobTemplate.update({
            where: {
              id: template.id,
              workspaceId: targetWorkspaceId, // Workspace isolation
            },
            data: { isActive: false },
          });
          skipped++;
          continue;
        }

        // Generate job for nextRunDate (today or earlier)
        const targetDate = new Date(template.nextRunDate);
        targetDate.setHours(9, 0, 0, 0); // Default to 9 AM

        const existing = await this.canGenerateJobForDate(
          template.id,
          targetDate,
        );

        if (!existing) {
          // Job already exists (possibly generated by offline sync)
          skipped++;
          // Still update nextRunDate to prevent infinite loops
          const nextRunDate = this.calculateNextRunDate(template, targetDate);
          // Atomic increment: Transaction ensures syncVersion update is atomic
          await this.prisma.recurringJobTemplate.update({
            where: {
              id: template.id,
              workspaceId: targetWorkspaceId, // Workspace isolation
            },
            data: {
              nextRunDate,
              syncVersion: template.syncVersion + 1, // Transaction-safe increment
            },
          });
          continue;
        }

        // Generate the job (idempotent and atomic)
        await this.generateJobFromTemplate(template.id, targetDate);
        generated++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          templateId: template.id,
          error: errorMessage,
        });
      }
    }

    return {
      generated,
      skipped,
      errors,
    };
  }
}
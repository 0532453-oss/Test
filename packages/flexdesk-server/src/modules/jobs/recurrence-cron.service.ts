import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import { RecurrenceService } from './recurrence.service';

import { PrismaService } from '@/core/database/prisma.service';
import { runWithWorkspace } from '@/core/database/workspace-context';

/**
 * RecurrenceCronService
 *
 * Scheduled task service that runs daily to generate recurring jobs.
 * Iterates through all workspaces and generates jobs for templates
 * where nextRunDate <= today.
 *
 * Schedule: Daily at 1:00 AM (configurable via RECURRENCE_CRON_SCHEDULE env)
 */
@Injectable()
export class RecurrenceCronService implements OnModuleInit {
  private readonly logger = new Logger(RecurrenceCronService.name);
  private isEnabled = true;

  constructor(
    private readonly prisma: PrismaService,
    private readonly recurrenceService: RecurrenceService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    // Allow disabling cron via environment variable (useful for testing)
    const cronEnabled = this.configService.get<string>('RECURRENCE_CRON_ENABLED');
    this.isEnabled = cronEnabled !== 'false';

    if (this.isEnabled) {
      this.logger.log('Recurrence cron job initialized and enabled');
    } else {
      this.logger.log('Recurrence cron job is disabled via RECURRENCE_CRON_ENABLED=false');
    }
  }

  /**
   * Main cron job that runs daily at 1:00 AM
   * Generates recurring jobs for all workspaces
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleRecurringJobGeneration(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    this.logger.log('Starting daily recurring job generation...');

    try {
      const results = await this.processAllWorkspaces();

      this.logger.log(
        `Recurring job generation complete: ${results.totalGenerated} generated, ` +
          `${results.totalSkipped} skipped, ${results.totalErrors} errors across ` +
          `${results.workspacesProcessed} workspaces`,
      );

      // Log errors for debugging
      if (results.errors.length > 0) {
        for (const error of results.errors) {
          this.logger.error(
            `Error generating job for template ${error.templateId} in workspace ${error.workspaceId}: ${error.error}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Fatal error in recurring job generation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Process all workspaces and generate recurring jobs
   * This method can also be called manually via API for testing
   */
  async processAllWorkspaces(): Promise<{
    workspacesProcessed: number;
    totalGenerated: number;
    totalSkipped: number;
    totalErrors: number;
    errors: Array<{ workspaceId: string; templateId: string; error: string }>;
  }> {
    // Get all workspaces with active recurring templates
    const workspaces = await this.prisma.workspace.findMany({
      where: {
        recurringJobTemplates: {
          some: {
            isActive: true,
          },
        },
      },
      select: {
        id: true,
      },
    });

    let totalGenerated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    const errors: Array<{ workspaceId: string; templateId: string; error: string }> = [];

    for (const workspace of workspaces) {
      try {
        // Run recurrence generation in workspace context
        const result = await runWithWorkspace(workspace.id, async () => {
          return await this.recurrenceService.generateRecurringJobs(workspace.id);
        });

        totalGenerated += result.generated;
        totalSkipped += result.skipped;
        totalErrors += result.errors.length;

        // Collect errors with workspace context
        for (const err of result.errors) {
          errors.push({
            workspaceId: workspace.id,
            templateId: err.templateId,
            error: err.error,
          });
        }
      } catch (error) {
        this.logger.error(
          `Error processing workspace ${workspace.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        totalErrors++;
        errors.push({
          workspaceId: workspace.id,
          templateId: 'N/A',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      workspacesProcessed: workspaces.length,
      totalGenerated,
      totalSkipped,
      totalErrors,
      errors,
    };
  }

  /**
   * Manual trigger for recurring job generation (useful for testing/admin)
   * Can be called via RecurrenceController
   */
  async triggerManualRun(): Promise<{
    workspacesProcessed: number;
    totalGenerated: number;
    totalSkipped: number;
    totalErrors: number;
    errors: Array<{ workspaceId: string; templateId: string; error: string }>;
  }> {
    this.logger.log('Manual recurring job generation triggered');
    return await this.processAllWorkspaces();
  }

  /**
   * Check if cron is enabled (for testing/monitoring)
   */
  isCronEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Enable/disable cron at runtime (for testing)
   */
  setCronEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.logger.log(`Recurrence cron job ${enabled ? 'enabled' : 'disabled'}`);
  }
}

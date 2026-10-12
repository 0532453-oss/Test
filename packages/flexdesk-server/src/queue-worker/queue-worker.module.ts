import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

// Processors
import { InvoiceGenerationProcessor } from './processors/invoice-generation.processor';
import { JobNotificationProcessor } from './processors/job-notification.processor';
import { ReportGenerationProcessor } from './processors/report-generation.processor';

/**
 * Queue Worker Module
 *
 * Handles asynchronous task processing via scheduled cron jobs:
 * - Job notifications (reminders, completion alerts)
 * - Invoice generation for completed jobs
 * - Report generation (daily, weekly)
 * - Email/SMS sending for overdue invoices
 *
 * Uses @nestjs/schedule for cron-based processing.
 * For real-time event queuing, BullMQ can be added later.
 *
 * Dependencies:
 * - NotificationService is provided by the global NotificationModule
 * - PrismaService is provided by CoreModule
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
  ],
  providers: [
    JobNotificationProcessor,
    InvoiceGenerationProcessor,
    ReportGenerationProcessor,
  ],
  exports: [
    JobNotificationProcessor,
    InvoiceGenerationProcessor,
    ReportGenerationProcessor,
  ],
})
export class QueueWorkerModule {}

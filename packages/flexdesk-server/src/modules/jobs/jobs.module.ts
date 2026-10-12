import { Module } from '@nestjs/common';

// Controllers
import { InvoiceManagerModule } from '../billing/invoice-manager';

import { JobController } from './controllers/job.controller';
import { RecurrenceController } from './controllers/recurrence.controller';

// Main Service
import { JobCompletionManagerModule } from './job-completion-manager';
import { JobDispatchManagerModule } from './job-dispatch-manager';
import { JobSchedulingManagerModule } from './job-scheduling-manager';
import { JobService } from './job.service';

// Manager Modules

// Billing dependency (for invoice generation on job completion)

// Recurrence Engine
import { RecurrenceCronService } from './recurrence-cron.service';
import { RecurrenceService } from './recurrence.service';

/**
 * Jobs Module
 *
 * Handles all job-related functionality:
 * - Job CRUD operations
 * - Job scheduling (via JobSchedulingManager)
 * - Job dispatching (via JobDispatchManager)
 * - Job completion (via JobCompletionManager)
 * - Recurring job management (via RecurrenceEngine)
 */
@Module({
  imports: [
    JobSchedulingManagerModule,
    JobDispatchManagerModule,
    JobCompletionManagerModule,
    InvoiceManagerModule,
  ],
  controllers: [
    JobController,
    RecurrenceController,
  ],
  providers: [
    JobService,
    RecurrenceService,
    RecurrenceCronService,
  ],
  exports: [
    JobService,
    JobSchedulingManagerModule,
    JobDispatchManagerModule,
    JobCompletionManagerModule,
  ],
})
export class JobsModule {}

import { Prisma, type RecurringJobTemplate, type Job } from '@prisma/client';
import { type PrismaService } from '@/core/database/prisma.service';
import { BaseService } from '@/engine/base.service';
export declare class RecurrenceService extends BaseService<Prisma.RecurringJobTemplateDelegate> {
    constructor(prisma: PrismaService);
    createTemplate(data: {
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
    }): Promise<RecurringJobTemplate>;
    calculateNextRunDate(template: RecurringJobTemplate, fromDate?: Date): Date;
    canGenerateJobForDate(templateId: string, scheduledAt: Date): Promise<boolean>;
    generateJobFromTemplate(templateId: string, targetDate: Date): Promise<Job>;
    reconcileTemplateSync(localTemplate: RecurringJobTemplate, serverTemplate: RecurringJobTemplate): Promise<{
        resolvedTemplate: RecurringJobTemplate;
        regeneratedJobs: Job[];
    }>;
    generateRecurringJobs(workspaceId?: string): Promise<{
        generated: number;
        skipped: number;
        errors: Array<{
            templateId: string;
            error: string;
        }>;
    }>;
}

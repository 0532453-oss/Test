import { type RecurringJobTemplate, type Job } from '@prisma/client';
import { type CreateTemplateDto } from '../dto/recurrence.dto';
import { type RecurrenceService } from '../recurrence.service';
export declare class RecurrenceController {
    private readonly recurrenceService;
    constructor(recurrenceService: RecurrenceService);
    createTemplate(createTemplateDto: CreateTemplateDto): Promise<RecurringJobTemplate>;
    processAllRecurringJobs(): Promise<{
        generated: number;
        skipped: number;
        errors: Array<{
            templateId: string;
            error: string;
        }>;
    }>;
    generateJob(id: string, body?: {
        targetDate?: string;
    }): Promise<Job>;
}

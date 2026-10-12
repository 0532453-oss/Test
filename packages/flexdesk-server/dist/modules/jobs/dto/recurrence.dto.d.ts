import { JobPriority } from '@prisma/client';
export declare enum RecurrenceFrequency {
    WEEKLY = "WEEKLY",
    BIWEEKLY = "BIWEEKLY",
    MONTHLY = "MONTHLY",
    CUSTOM = "CUSTOM"
}
export declare class CreateTemplateDto {
    title: string;
    frequency: RecurrenceFrequency;
    interval: number;
    startDate: Date;
    customerId: string;
    technicianId?: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    endDate?: Date;
    description?: string;
    priority?: JobPriority;
    estimatedDuration?: number;
    location?: Record<string, any>;
}

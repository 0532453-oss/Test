import { JobPriority } from '@prisma/client';
export declare class JobLocationDto {
    address?: string;
    lat?: number;
    lng?: number;
}
export declare class CreateJobDto {
    title: string;
    description?: string;
    customerId: string;
    technicianId?: string;
    priority?: JobPriority;
    scheduledAt?: string;
    scheduledDate?: string;
    scheduledStartTime?: string;
    scheduledEndTime?: string;
    assignedTechnicianId?: string;
    estimatedDuration?: number;
    location?: JobLocationDto;
}
export declare class DateRangeQueryDto {
    startDate: string;
    endDate: string;
}

import { JobPriority } from '@prisma/client';
import { EstimateLineItemDto, LocationDto } from './create-estimate.dto';
export declare class UpdateEstimateDto {
    title?: string;
    description?: string;
    lineItems?: EstimateLineItemDto[];
    discount?: number;
    taxRate?: number;
    validUntil?: string;
    estimatedDuration?: number;
    location?: LocationDto;
    priority?: JobPriority;
    customerNotes?: string;
    notes?: string;
    terms?: string;
}

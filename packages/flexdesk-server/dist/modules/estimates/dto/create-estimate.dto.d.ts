import { JobPriority } from '@prisma/client';
export declare class EstimateLineItemDto {
    description: string;
    quantity: number;
    unitPrice: number;
    serviceType?: string;
}
export declare class LocationDto {
    address: string;
    lat?: number;
    lng?: number;
}
export declare class CreateEstimateDto {
    customerId: string;
    title: string;
    description?: string;
    lineItems: EstimateLineItemDto[];
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

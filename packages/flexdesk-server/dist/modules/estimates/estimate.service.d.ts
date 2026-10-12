import { type Estimate, EstimateStatus, JobPriority } from '@prisma/client';
import { type PrismaService } from '@/core/database/prisma.service';
export interface CreateEstimateInput {
    customerId: string;
    title: string;
    description?: string;
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        serviceType?: string;
    }[];
    discount?: number;
    taxRate?: number;
    validUntil?: Date;
    estimatedDuration?: number;
    location?: {
        address: string;
        lat?: number;
        lng?: number;
    };
    priority?: JobPriority;
    customerNotes?: string;
    notes?: string;
    terms?: string;
}
export interface UpdateEstimateInput {
    title?: string;
    description?: string;
    lineItems?: {
        description: string;
        quantity: number;
        unitPrice: number;
        serviceType?: string;
    }[];
    discount?: number;
    taxRate?: number;
    validUntil?: Date;
    estimatedDuration?: number;
    location?: {
        address: string;
        lat?: number;
        lng?: number;
    };
    priority?: JobPriority;
    customerNotes?: string;
    notes?: string;
    terms?: string;
}
export interface ConvertToJobInput {
    technicianId?: string;
    scheduledAt?: Date;
}
export declare class EstimateService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getWorkspaceIdOrThrow;
    findAll(status?: EstimateStatus): Promise<Estimate[]>;
    findById(id: string): Promise<Estimate>;
    findByCustomer(customerId: string): Promise<Estimate[]>;
    create(input: CreateEstimateInput): Promise<Estimate>;
    update(id: string, input: UpdateEstimateInput): Promise<Estimate>;
    send(id: string): Promise<Estimate>;
    markViewed(id: string): Promise<Estimate>;
    accept(id: string): Promise<Estimate>;
    reject(id: string): Promise<Estimate>;
    convertToJob(id: string, input?: ConvertToJobInput): Promise<Estimate>;
    delete(id: string): Promise<void>;
    checkExpiredEstimates(): Promise<number>;
    private generateEstimateNumber;
}

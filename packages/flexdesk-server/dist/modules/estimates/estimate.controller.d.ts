import { type Estimate, EstimateStatus } from '@prisma/client';
import { type ConvertToJobDto } from './dto/convert-to-job.dto';
import { type CreateEstimateDto } from './dto/create-estimate.dto';
import { type UpdateEstimateDto } from './dto/update-estimate.dto';
import { type EstimateService } from './estimate.service';
export declare class EstimateController {
    private readonly estimateService;
    constructor(estimateService: EstimateService);
    create(dto: CreateEstimateDto): Promise<Estimate>;
    findAll(status?: EstimateStatus): Promise<Estimate[]>;
    findOne(id: string): Promise<Estimate>;
    findByCustomer(customerId: string): Promise<Estimate[]>;
    update(id: string, dto: UpdateEstimateDto): Promise<Estimate>;
    send(id: string): Promise<Estimate>;
    markViewed(id: string): Promise<Estimate>;
    accept(id: string): Promise<Estimate>;
    reject(id: string): Promise<Estimate>;
    convertToJob(id: string, dto: ConvertToJobDto): Promise<Estimate>;
    delete(id: string): Promise<void>;
    checkExpired(): Promise<{
        expiredCount: number;
    }>;
}

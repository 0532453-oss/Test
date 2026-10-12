import { type Job, type Technician } from '@prisma/client';
import { type PrismaService } from '@/core/database/prisma.service';
interface PublicTechnicianInfo {
    id: string;
    name: string;
    currentLocation: Technician['currentLocation'] | null;
}
interface PublicTrackingResponse {
    job: Job | null;
    technician: PublicTechnicianInfo | null;
}
export declare class PublicTrackingController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    trackJob(token: string): Promise<PublicTrackingResponse>;
}
export {};

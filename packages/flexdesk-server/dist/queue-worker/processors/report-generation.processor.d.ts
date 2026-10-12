import { type PrismaService } from '@/core/database';
export declare class ReportGenerationProcessor {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    generateDailySummary(): Promise<void>;
    generateWeeklyReport(): Promise<void>;
    private buildWeeklyReport;
}

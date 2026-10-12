import { type OnModuleInit } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { type RecurrenceService } from './recurrence.service';
import { type PrismaService } from '@/core/database/prisma.service';
export declare class RecurrenceCronService implements OnModuleInit {
    private readonly prisma;
    private readonly recurrenceService;
    private readonly configService;
    private readonly logger;
    private isEnabled;
    constructor(prisma: PrismaService, recurrenceService: RecurrenceService, configService: ConfigService);
    onModuleInit(): void;
    handleRecurringJobGeneration(): Promise<void>;
    processAllWorkspaces(): Promise<{
        workspacesProcessed: number;
        totalGenerated: number;
        totalSkipped: number;
        totalErrors: number;
        errors: Array<{
            workspaceId: string;
            templateId: string;
            error: string;
        }>;
    }>;
    triggerManualRun(): Promise<{
        workspacesProcessed: number;
        totalGenerated: number;
        totalSkipped: number;
        totalErrors: number;
        errors: Array<{
            workspaceId: string;
            templateId: string;
            error: string;
        }>;
    }>;
    isCronEnabled(): boolean;
    setCronEnabled(enabled: boolean): void;
}

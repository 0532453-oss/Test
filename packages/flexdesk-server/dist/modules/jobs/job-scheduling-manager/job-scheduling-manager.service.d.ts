import { type PrismaService } from '@/core/database';
export declare class JobSchedulingManagerService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    scheduleJob(params: {
        jobId: string;
        scheduledDate: string;
        scheduledStartTime: string;
        technicianId?: string;
        workspaceId: string;
    }): Promise<{
        workspaceId: string;
        id: string;
        description: string | null;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.JobStatus;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        lastSyncedAt: Date | null;
        syncVersion: number;
        customerId: string;
        scheduledAt: Date | null;
        technicianId: string | null;
        propertyId: string | null;
        priority: import("@prisma/client").$Enums.JobPriority;
        scheduledDate: string | null;
        scheduledStartTime: string | null;
        scheduledEndTime: string | null;
        startedAt: Date | null;
        completedAt: Date | null;
        location: import("@prisma/client/runtime/library").JsonValue | null;
        estimatedDuration: number | null;
        recurringTemplateId: string | null;
    }>;
    rescheduleJob(params: {
        jobId: string;
        newDate: string;
        newStartTime: string;
        workspaceId: string;
        reason?: string;
    }): Promise<{
        workspaceId: string;
        id: string;
        description: string | null;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.JobStatus;
        syncStatus: import("@prisma/client").$Enums.SyncStatus;
        lastSyncedAt: Date | null;
        syncVersion: number;
        customerId: string;
        scheduledAt: Date | null;
        technicianId: string | null;
        propertyId: string | null;
        priority: import("@prisma/client").$Enums.JobPriority;
        scheduledDate: string | null;
        scheduledStartTime: string | null;
        scheduledEndTime: string | null;
        startedAt: Date | null;
        completedAt: Date | null;
        location: import("@prisma/client/runtime/library").JsonValue | null;
        estimatedDuration: number | null;
        recurringTemplateId: string | null;
    }>;
    getAvailableSlots(params: {
        technicianId?: string;
        date: string;
        workspaceId: string;
    }): Promise<Array<{
        startTime: string;
        endTime: string;
        technicianId?: string;
    }>>;
    private getSlotsForTechnician;
    private toMinutes;
    private fromMinutes;
    suggestTechnician(params: {
        jobId: string;
        requiredSkills?: string[];
        workspaceId: string;
    }): Promise<Array<{
        technicianId: string;
        technicianName: string;
        score: number;
        activeJobCount: number;
        distanceMeters: number | null;
    }>>;
    autoAssignTechnician(params: {
        jobId: string;
        requiredSkills?: string[];
        workspaceId: string;
    }): Promise<{
        technicianId: string;
        technicianName: string;
        score: number;
        activeJobCount: number;
        distanceMeters: number | null;
    } | null>;
    private timeSlotsOverlap;
}

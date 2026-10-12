import { type Workspace, type WorkspaceMember } from '@prisma/client';
import { type AddMemberDto } from './dto/add-member.dto';
import { type CreateWorkspaceDto } from './dto/create-workspace.dto';
import { type UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { type PrismaService } from '@/core/database/prisma.service';
export declare class WorkspaceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createWorkspace(dto: CreateWorkspaceDto, ownerId: string): Promise<Workspace>;
    getWorkspaceById(id: string): Promise<Workspace>;
    getWorkspaceBySubdomain(subdomain: string): Promise<Workspace>;
    getUserWorkspaces(userId: string): Promise<Workspace[]>;
    updateWorkspace(id: string, dto: UpdateWorkspaceDto, userId: string): Promise<Workspace>;
    addMember(workspaceId: string, dto: AddMemberDto, requesterId: string): Promise<WorkspaceMember>;
    removeMember(workspaceId: string, memberId: string, requesterId: string): Promise<void>;
    updateMemberRole(workspaceId: string, memberId: string, role: string, requesterId: string): Promise<WorkspaceMember>;
    getWorkspaceStats(workspaceId: string): Promise<{
        totalJobs: number;
        completedJobs: number;
        activeJobs: number;
        totalCustomers: number;
        totalTechnicians: number;
        totalRevenue: number;
    }>;
    private requireRole;
}

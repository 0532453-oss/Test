import { type Workspace, type WorkspaceMember } from '@prisma/client';
import { type AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { type AddMemberDto } from './dto/add-member.dto';
import { type CreateWorkspaceDto } from './dto/create-workspace.dto';
import { type UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { type UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { type WorkspaceService } from './workspace.service';
export declare class WorkspaceController {
    private readonly workspaceService;
    constructor(workspaceService: WorkspaceService);
    create(dto: CreateWorkspaceDto, user: AuthenticatedUser): Promise<Workspace>;
    getMyWorkspaces(user: AuthenticatedUser): Promise<Workspace[]>;
    getById(id: string): Promise<Workspace>;
    getStats(id: string): Promise<{
        totalJobs: number;
        completedJobs: number;
        activeJobs: number;
        totalCustomers: number;
        totalTechnicians: number;
        totalRevenue: number;
    }>;
    update(id: string, dto: UpdateWorkspaceDto, user: AuthenticatedUser): Promise<Workspace>;
    addMember(id: string, dto: AddMemberDto, user: AuthenticatedUser): Promise<WorkspaceMember>;
    removeMember(id: string, memberId: string, user: AuthenticatedUser): Promise<void>;
    updateMemberRole(id: string, memberId: string, dto: UpdateMemberRoleDto, user: AuthenticatedUser): Promise<WorkspaceMember>;
}

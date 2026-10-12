import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { type Workspace, type WorkspaceMember, Prisma } from '@prisma/client';

import { type AddMemberDto } from './dto/add-member.dto';
import { type CreateWorkspaceDto } from './dto/create-workspace.dto';
import { type UpdateWorkspaceDto } from './dto/update-workspace.dto';

import { PrismaService } from '@/core/database/prisma.service';

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  async createWorkspace(
    dto: CreateWorkspaceDto,
    ownerId: string,
  ): Promise<Workspace> {
    const existingSubdomain = await this.prisma.workspace.findUnique({
      where: { subdomain: dto.subdomain },
    });

    if (existingSubdomain) {
      throw new ConflictException('Subdomain already taken');
    }

    const workspace = await this.prisma.workspace.create({
      data: {
        name: dto.name,
        subdomain: dto.subdomain,
        members: {
          create: {
            userId: ownerId,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    return workspace;
  }

  async getWorkspaceById(id: string): Promise<Workspace> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async getWorkspaceBySubdomain(subdomain: string): Promise<Workspace> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { subdomain },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: true,
      },
    });

    return memberships.map((m) => m.workspace);
  }

  async updateWorkspace(
    id: string,
    dto: UpdateWorkspaceDto,
    userId: string,
  ): Promise<Workspace> {
    await this.requireRole(id, userId, ['OWNER', 'ADMIN']);

    if (dto.subdomain) {
      const existingSubdomain = await this.prisma.workspace.findFirst({
        where: {
          subdomain: dto.subdomain,
          id: { not: id },
        },
      });

      if (existingSubdomain) {
        throw new ConflictException('Subdomain already taken');
      }
    }

    const workspace = await this.prisma.workspace.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.subdomain && { subdomain: dto.subdomain }),
      },
    });

    return workspace;
  }

  async addMember(
    workspaceId: string,
    dto: AddMemberDto,
    requesterId: string,
  ): Promise<WorkspaceMember> {
    await this.requireRole(workspaceId, requesterId, ['OWNER', 'ADMIN']);

    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: dto.userId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this workspace');
    }

    const member = await this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: dto.userId,
        role: dto.role,
      },
      include: { user: true },
    });

    return member;
  }

  async removeMember(
    workspaceId: string,
    memberId: string,
    requesterId: string,
  ): Promise<void> {
    await this.requireRole(workspaceId, requesterId, ['OWNER', 'ADMIN']);

    const member = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found in this workspace');
    }

    if (member.role === 'OWNER') {
      throw new ForbiddenException('Cannot remove workspace owner');
    }

    await this.prisma.workspaceMember.delete({
      where: { id: memberId },
    });
  }

  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    role: string,
    requesterId: string,
  ): Promise<WorkspaceMember> {
    await this.requireRole(workspaceId, requesterId, ['OWNER']);

    const member = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found in this workspace');
    }

    if (member.role === 'OWNER') {
      throw new ForbiddenException('Cannot change owner role');
    }

    const updated = await this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: true },
    });

    return updated;
  }

  async getWorkspaceStats(workspaceId: string): Promise<{
    totalJobs: number;
    completedJobs: number;
    activeJobs: number;
    totalCustomers: number;
    totalTechnicians: number;
    totalRevenue: number;
  }> {
    const [
      totalJobs,
      completedJobs,
      activeJobs,
      totalCustomers,
      totalTechnicians,
      invoices,
    ] = await Promise.all([
      this.prisma.job.count({ where: { workspaceId } }),
      this.prisma.job.count({ where: { workspaceId, status: 'COMPLETED' } }),
      this.prisma.job.count({
        where: { workspaceId, status: { in: ['SCHEDULED', 'DISPATCHED', 'IN_PROGRESS'] } },
      }),
      this.prisma.customer.count({ where: { workspaceId } }),
      this.prisma.technician.count({ where: { workspaceId } }),
      this.prisma.invoice.findMany({
        where: { workspaceId, status: 'PAID' },
        select: { total: true },
      }),
    ]);

    const totalRevenue = invoices.reduce(
      (sum, inv) => sum + Number(inv.total),
      0,
    );

    return {
      totalJobs,
      completedJobs,
      activeJobs,
      totalCustomers,
      totalTechnicians,
      totalRevenue,
    };
  }

  private async requireRole(
    workspaceId: string,
    userId: string,
    allowedRoles: string[],
  ): Promise<void> {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenException(
        `Required role: ${allowedRoles.join(' or ')}`,
      );
    }
  }
}

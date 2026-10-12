"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceService = void 0;
const common_1 = require("@nestjs/common");
let WorkspaceService = class WorkspaceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createWorkspace(dto, ownerId) {
        const existingSubdomain = await this.prisma.workspace.findUnique({
            where: { subdomain: dto.subdomain },
        });
        if (existingSubdomain) {
            throw new common_1.ConflictException('Subdomain already taken');
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
    async getWorkspaceById(id) {
        const workspace = await this.prisma.workspace.findUnique({
            where: { id },
            include: {
                members: {
                    include: { user: true },
                },
            },
        });
        if (!workspace) {
            throw new common_1.NotFoundException('Workspace not found');
        }
        return workspace;
    }
    async getWorkspaceBySubdomain(subdomain) {
        const workspace = await this.prisma.workspace.findUnique({
            where: { subdomain },
        });
        if (!workspace) {
            throw new common_1.NotFoundException('Workspace not found');
        }
        return workspace;
    }
    async getUserWorkspaces(userId) {
        const memberships = await this.prisma.workspaceMember.findMany({
            where: { userId },
            include: {
                workspace: true,
            },
        });
        return memberships.map((m) => m.workspace);
    }
    async updateWorkspace(id, dto, userId) {
        await this.requireRole(id, userId, ['OWNER', 'ADMIN']);
        if (dto.subdomain) {
            const existingSubdomain = await this.prisma.workspace.findFirst({
                where: {
                    subdomain: dto.subdomain,
                    id: { not: id },
                },
            });
            if (existingSubdomain) {
                throw new common_1.ConflictException('Subdomain already taken');
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
    async addMember(workspaceId, dto, requesterId) {
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
            throw new common_1.ConflictException('User is already a member of this workspace');
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
    async removeMember(workspaceId, memberId, requesterId) {
        await this.requireRole(workspaceId, requesterId, ['OWNER', 'ADMIN']);
        const member = await this.prisma.workspaceMember.findUnique({
            where: { id: memberId },
        });
        if (!member || member.workspaceId !== workspaceId) {
            throw new common_1.NotFoundException('Member not found in this workspace');
        }
        if (member.role === 'OWNER') {
            throw new common_1.ForbiddenException('Cannot remove workspace owner');
        }
        await this.prisma.workspaceMember.delete({
            where: { id: memberId },
        });
    }
    async updateMemberRole(workspaceId, memberId, role, requesterId) {
        await this.requireRole(workspaceId, requesterId, ['OWNER']);
        const member = await this.prisma.workspaceMember.findUnique({
            where: { id: memberId },
        });
        if (!member || member.workspaceId !== workspaceId) {
            throw new common_1.NotFoundException('Member not found in this workspace');
        }
        if (member.role === 'OWNER') {
            throw new common_1.ForbiddenException('Cannot change owner role');
        }
        const updated = await this.prisma.workspaceMember.update({
            where: { id: memberId },
            data: { role },
            include: { user: true },
        });
        return updated;
    }
    async getWorkspaceStats(workspaceId) {
        const [totalJobs, completedJobs, activeJobs, totalCustomers, totalTechnicians, invoices,] = await Promise.all([
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
        const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
        return {
            totalJobs,
            completedJobs,
            activeJobs,
            totalCustomers,
            totalTechnicians,
            totalRevenue,
        };
    }
    async requireRole(workspaceId, userId, allowedRoles) {
        const member = await this.prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId,
                },
            },
        });
        if (!member) {
            throw new common_1.ForbiddenException('You are not a member of this workspace');
        }
        if (!allowedRoles.includes(member.role)) {
            throw new common_1.ForbiddenException(`Required role: ${allowedRoles.join(' or ')}`);
        }
    }
};
exports.WorkspaceService = WorkspaceService;
exports.WorkspaceService = WorkspaceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function])
], WorkspaceService);

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
exports.RoleService = exports.SYSTEM_ROLES = exports.ACTIONS = exports.RESOURCES = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const base_service_1 = require("../../engine/base.service");
exports.RESOURCES = [
    'jobs',
    'customers',
    'invoices',
    'estimates',
    'technicians',
    'properties',
    'parts',
    'reports',
    'settings',
    'roles',
    'workspace',
];
exports.ACTIONS = [
    'create',
    'read',
    'update',
    'delete',
    'manage',
    'assign',
];
exports.SYSTEM_ROLES = {
    OWNER: {
        name: 'Owner',
        description: 'Full workspace ownership with all permissions',
        permissions: exports.RESOURCES.map((resource) => ({ resource, action: 'manage' })),
    },
    ADMIN: {
        name: 'Admin',
        description: 'Administrative access to most features',
        permissions: exports.RESOURCES.filter((r) => r !== 'workspace').map((resource) => ({
            resource,
            action: 'manage',
        })),
    },
    MANAGER: {
        name: 'Manager',
        description: 'Can manage jobs, customers, and view reports',
        permissions: [
            { resource: 'jobs', action: 'manage' },
            { resource: 'customers', action: 'manage' },
            { resource: 'invoices', action: 'manage' },
            { resource: 'estimates', action: 'manage' },
            { resource: 'technicians', action: 'read' },
            { resource: 'technicians', action: 'assign' },
            { resource: 'properties', action: 'manage' },
            { resource: 'parts', action: 'manage' },
            { resource: 'reports', action: 'read' },
        ],
    },
    DISPATCHER: {
        name: 'Dispatcher',
        description: 'Can dispatch jobs and manage schedules',
        permissions: [
            { resource: 'jobs', action: 'read' },
            { resource: 'jobs', action: 'update' },
            { resource: 'jobs', action: 'assign' },
            { resource: 'customers', action: 'read' },
            { resource: 'technicians', action: 'read' },
            { resource: 'properties', action: 'read' },
        ],
    },
    TECHNICIAN: {
        name: 'Technician',
        description: 'Field technician with limited access',
        permissions: [
            { resource: 'jobs', action: 'read' },
            { resource: 'jobs', action: 'update' },
            { resource: 'customers', action: 'read' },
            { resource: 'properties', action: 'read' },
            { resource: 'parts', action: 'read' },
        ],
    },
    VIEWER: {
        name: 'Viewer',
        description: 'Read-only access to most features',
        permissions: [
            { resource: 'jobs', action: 'read' },
            { resource: 'customers', action: 'read' },
            { resource: 'invoices', action: 'read' },
            { resource: 'estimates', action: 'read' },
            { resource: 'properties', action: 'read' },
        ],
    },
};
let RoleService = class RoleService extends base_service_1.BaseService {
    constructor(prisma) {
        super(prisma, prisma.role, 'Role');
    }
    async createRole(dto) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const existing = await this.prisma.role.findUnique({
            where: { workspaceId_name: { workspaceId, name: dto.name } },
        });
        if (existing) {
            throw new common_1.ConflictException(`Role with name "${dto.name}" already exists`);
        }
        if (dto.isDefault) {
            await this.prisma.role.updateMany({
                where: { workspaceId, isDefault: true },
                data: { isDefault: false },
            });
        }
        const role = await this.prisma.$transaction(async (tx) => {
            const newRole = await tx.role.create({
                data: {
                    workspace: { connect: { id: workspaceId } },
                    name: dto.name,
                    description: dto.description,
                    isDefault: dto.isDefault ?? false,
                    isSystem: false,
                },
            });
            if (dto.permissions && dto.permissions.length > 0) {
                await this.assignPermissionsToRole(newRole.id, dto.permissions, tx);
            }
            return tx.role.findUnique({
                where: { id: newRole.id },
                include: {
                    permissions: {
                        include: { permission: true },
                    },
                },
            });
        });
        return role;
    }
    async findAllRoles() {
        const roles = await this.findMany({
            orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
            include: {
                permissions: {
                    include: { permission: true },
                },
            },
        });
        return roles;
    }
    async findRoleById(id) {
        const role = await this.findUniqueOrThrow({
            where: { id },
            include: {
                permissions: {
                    include: { permission: true },
                },
            },
        });
        return role;
    }
    async findRoleByName(name) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const role = await this.prisma.role.findUnique({
            where: { workspaceId_name: { workspaceId, name } },
            include: {
                permissions: {
                    include: { permission: true },
                },
            },
        });
        return role;
    }
    async getDefaultRole() {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const role = await this.prisma.role.findFirst({
            where: { workspaceId, isDefault: true },
            include: {
                permissions: {
                    include: { permission: true },
                },
            },
        });
        return role;
    }
    async updateRole(id, dto) {
        const existing = await this.findRoleById(id);
        const workspaceId = this.getWorkspaceIdOrThrow();
        if (existing.isSystem) {
            if (dto.name !== undefined || dto.isDefault !== undefined) {
                throw new common_1.BadRequestException('Cannot modify name or default status of system roles');
            }
        }
        if (dto.name && dto.name !== existing.name) {
            const conflict = await this.prisma.role.findUnique({
                where: { workspaceId_name: { workspaceId, name: dto.name } },
            });
            if (conflict) {
                throw new common_1.ConflictException(`Role with name "${dto.name}" already exists`);
            }
        }
        if (dto.isDefault === true) {
            await this.prisma.role.updateMany({
                where: { workspaceId, isDefault: true, id: { not: id } },
                data: { isDefault: false },
            });
        }
        const role = await this.prisma.$transaction(async (tx) => {
            await tx.role.update({
                where: { id },
                data: {
                    ...(dto.name !== undefined && { name: dto.name }),
                    ...(dto.description !== undefined && { description: dto.description }),
                    ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
                },
            });
            if (dto.permissions !== undefined) {
                await tx.rolePermission.deleteMany({
                    where: { roleId: id },
                });
                if (dto.permissions.length > 0) {
                    await this.assignPermissionsToRole(id, dto.permissions, tx);
                }
            }
            return tx.role.findUnique({
                where: { id },
                include: {
                    permissions: {
                        include: { permission: true },
                    },
                },
            });
        });
        return role;
    }
    async deleteRole(id) {
        const role = await this.findRoleById(id);
        if (role.isSystem) {
            throw new common_1.BadRequestException('Cannot delete system roles');
        }
        const memberCount = await this.prisma.workspaceMember.count({
            where: { roleId: id },
        });
        if (memberCount > 0) {
            throw new common_1.BadRequestException(`Cannot delete role: ${memberCount} member(s) are assigned to this role`);
        }
        const deleted = await this.delete({ where: { id } });
        return deleted;
    }
    async findAllPermissions() {
        return this.prisma.permission.findMany({
            orderBy: [{ resource: 'asc' }, { action: 'asc' }],
        });
    }
    async findPermissionsByResource(resource) {
        return this.prisma.permission.findMany({
            where: { resource },
            orderBy: { action: 'asc' },
        });
    }
    async createPermission(dto) {
        const existing = await this.prisma.permission.findUnique({
            where: { resource_action: { resource: dto.resource, action: dto.action } },
        });
        if (existing) {
            throw new common_1.ConflictException(`Permission "${dto.resource}:${dto.action}" already exists`);
        }
        return this.prisma.permission.create({
            data: {
                resource: dto.resource,
                action: dto.action,
                description: dto.description,
            },
        });
    }
    async addPermissionToRole(roleId, permissionId, scope, conditions) {
        const role = await this.findRoleById(roleId);
        const permission = await this.prisma.permission.findUnique({
            where: { id: permissionId },
        });
        if (!permission) {
            throw new common_1.NotFoundException('Permission not found');
        }
        const existing = await this.prisma.rolePermission.findUnique({
            where: { roleId_permissionId: { roleId, permissionId } },
        });
        if (existing) {
            throw new common_1.ConflictException('Permission already assigned to this role');
        }
        return this.prisma.rolePermission.create({
            data: {
                role: { connect: { id: roleId } },
                permission: { connect: { id: permissionId } },
                scope,
                conditions: conditions ? conditions : client_1.Prisma.JsonNull,
            },
        });
    }
    async removePermissionFromRole(roleId, permissionId) {
        const role = await this.findRoleById(roleId);
        if (role.isSystem) {
            throw new common_1.BadRequestException('Cannot modify permissions of system roles');
        }
        await this.prisma.rolePermission.delete({
            where: { roleId_permissionId: { roleId, permissionId } },
        });
    }
    async assignRoleToMember(memberId, roleId) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const member = await this.prisma.workspaceMember.findFirst({
            where: { id: memberId, workspaceId },
        });
        if (!member) {
            throw new common_1.NotFoundException('Workspace member not found');
        }
        const role = await this.findRoleById(roleId);
        await this.prisma.workspaceMember.update({
            where: { id: memberId },
            data: { roleId },
        });
    }
    async removeRoleFromMember(memberId) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const member = await this.prisma.workspaceMember.findFirst({
            where: { id: memberId, workspaceId },
        });
        if (!member) {
            throw new common_1.NotFoundException('Workspace member not found');
        }
        await this.prisma.workspaceMember.update({
            where: { id: memberId },
            data: { roleId: null },
        });
    }
    async getMembersByRole(roleId) {
        const role = await this.findRoleById(roleId);
        return this.prisma.workspaceMember.findMany({
            where: { roleId },
            include: {
                user: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
            },
        });
    }
    async hasPermission(userId, resource, action) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const member = await this.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
            include: {
                roleRef: {
                    include: {
                        permissions: {
                            include: { permission: true },
                        },
                    },
                },
            },
        });
        if (!member) {
            return false;
        }
        if (!member.roleRef) {
            return this.checkLegacyRolePermission(member.role, resource, action);
        }
        const hasExact = member.roleRef.permissions.some((rp) => rp.permission.resource === resource && rp.permission.action === action);
        if (hasExact) {
            return true;
        }
        const hasManage = member.roleRef.permissions.some((rp) => rp.permission.resource === resource && rp.permission.action === 'manage');
        return hasManage;
    }
    async getUserPermissions(userId) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const member = await this.prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
            include: {
                roleRef: {
                    include: {
                        permissions: {
                            include: { permission: true },
                        },
                    },
                },
            },
        });
        if (!member || !member.roleRef) {
            return [];
        }
        return member.roleRef.permissions.map((rp) => ({
            resource: rp.permission.resource,
            action: rp.permission.action,
            scope: rp.scope ?? undefined,
        }));
    }
    async initializeWorkspaceRoles(workspaceId) {
        await this.ensureStandardPermissions();
        for (const [key, config] of Object.entries(exports.SYSTEM_ROLES)) {
            const existing = await this.prisma.role.findUnique({
                where: { workspaceId_name: { workspaceId, name: config.name } },
            });
            if (existing) {
                continue;
            }
            const role = await this.prisma.role.create({
                data: {
                    workspace: { connect: { id: workspaceId } },
                    name: config.name,
                    description: config.description,
                    isSystem: true,
                    isDefault: key === 'VIEWER',
                },
            });
            for (const perm of config.permissions) {
                const permission = await this.prisma.permission.findUnique({
                    where: { resource_action: { resource: perm.resource, action: perm.action } },
                });
                if (permission) {
                    await this.prisma.rolePermission.create({
                        data: {
                            role: { connect: { id: role.id } },
                            permission: { connect: { id: permission.id } },
                        },
                    });
                }
            }
        }
    }
    async ensureStandardPermissions() {
        for (const resource of exports.RESOURCES) {
            for (const action of exports.ACTIONS) {
                const existing = await this.prisma.permission.findUnique({
                    where: { resource_action: { resource, action } },
                });
                if (!existing) {
                    await this.prisma.permission.create({
                        data: {
                            resource,
                            action,
                            description: `${action} ${resource}`,
                        },
                    });
                }
            }
        }
    }
    async assignPermissionsToRole(roleId, permissions, tx = this.prisma) {
        for (const perm of permissions) {
            const permission = await tx.permission.findUnique({
                where: { id: perm.permissionId },
            });
            if (!permission) {
                throw new common_1.NotFoundException(`Permission ${perm.permissionId} not found`);
            }
            await tx.rolePermission.create({
                data: {
                    role: { connect: { id: roleId } },
                    permission: { connect: { id: perm.permissionId } },
                    scope: perm.scope,
                    conditions: perm.conditions ? perm.conditions : client_1.Prisma.JsonNull,
                },
            });
        }
    }
    checkLegacyRolePermission(legacyRole, resource, action) {
        const legacyPermissions = {
            OWNER: { resources: exports.RESOURCES, actions: exports.ACTIONS },
            ADMIN: { resources: exports.RESOURCES.filter((r) => r !== 'workspace'), actions: exports.ACTIONS },
            MEMBER: {
                resources: ['jobs', 'customers', 'invoices', 'estimates', 'properties'],
                actions: ['create', 'read', 'update'],
            },
            TECHNICIAN: {
                resources: ['jobs', 'customers', 'properties', 'parts'],
                actions: ['read', 'update'],
            },
        };
        const perms = legacyPermissions[legacyRole];
        if (!perms) {
            return false;
        }
        return perms.resources.includes(resource) && perms.actions.includes(action);
    }
};
exports.RoleService = RoleService;
exports.RoleService = RoleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function])
], RoleService);

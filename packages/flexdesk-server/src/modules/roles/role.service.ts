import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { type Role, type Permission, type RolePermission, Prisma } from '@prisma/client';

import { type CreatePermissionDto } from './dto/create-permission.dto';
import { type CreateRoleDto, type PermissionAssignmentDto } from './dto/create-role.dto';
import { type UpdateRoleDto } from './dto/update-role.dto';

import { PrismaService } from '@/core/database/prisma.service';
import { BaseService } from '@/engine/base.service';

// Types for role with permissions
export interface RoleWithPermissions extends Role {
  permissions: (RolePermission & { permission: Permission })[];
}

// Standard resources and actions for the system
export const RESOURCES = [
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
] as const;

export const ACTIONS = [
  'create',
  'read',
  'update',
  'delete',
  'manage',  // Full control (implies all CRUD)
  'assign',  // Special action for assigning (e.g., assign technician to job)
] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];

// Default system roles with their permissions
export const SYSTEM_ROLES = {
  OWNER: {
    name: 'Owner',
    description: 'Full workspace ownership with all permissions',
    permissions: RESOURCES.map((resource) => ({ resource, action: 'manage' as Action })),
  },
  ADMIN: {
    name: 'Admin',
    description: 'Administrative access to most features',
    permissions: RESOURCES.filter((r) => r !== 'workspace').map((resource) => ({
      resource,
      action: 'manage' as Action,
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
    ] as { resource: Resource; action: Action }[],
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
    ] as { resource: Resource; action: Action }[],
  },
  TECHNICIAN: {
    name: 'Technician',
    description: 'Field technician with limited access',
    permissions: [
      { resource: 'jobs', action: 'read' },
      { resource: 'jobs', action: 'update' },  // Update job status, notes
      { resource: 'customers', action: 'read' },
      { resource: 'properties', action: 'read' },
      { resource: 'parts', action: 'read' },
    ] as { resource: Resource; action: Action }[],
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
    ] as { resource: Resource; action: Action }[],
  },
};

@Injectable()
export class RoleService extends BaseService<Prisma.RoleDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.role, 'Role');
  }

  // ==================== ROLE CRUD ====================

  /**
   * Create a new role with optional permissions
   */
  async createRole(dto: CreateRoleDto): Promise<RoleWithPermissions> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    // Check for duplicate role name
    const existing = await this.prisma.role.findUnique({
      where: { workspaceId_name: { workspaceId, name: dto.name } },
    });

    if (existing) {
      throw new ConflictException(`Role with name "${dto.name}" already exists`);
    }

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.role.updateMany({
        where: { workspaceId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Create role with permissions in a transaction
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

      // Assign permissions if provided
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

    return role as RoleWithPermissions;
  }

  /**
   * Get all roles in the workspace
   */
  async findAllRoles(): Promise<RoleWithPermissions[]> {
    const roles = await this.findMany({
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
    return roles as RoleWithPermissions[];
  }

  /**
   * Get a single role by ID
   */
  async findRoleById(id: string): Promise<RoleWithPermissions> {
    const role = await this.findUniqueOrThrow({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
    return role as RoleWithPermissions;
  }

  /**
   * Get role by name
   */
  async findRoleByName(name: string): Promise<RoleWithPermissions | null> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const role = await this.prisma.role.findUnique({
      where: { workspaceId_name: { workspaceId, name } },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    return role as RoleWithPermissions | null;
  }

  /**
   * Get the default role for new members
   */
  async getDefaultRole(): Promise<RoleWithPermissions | null> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const role = await this.prisma.role.findFirst({
      where: { workspaceId, isDefault: true },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    return role as RoleWithPermissions | null;
  }

  /**
   * Update a role
   */
  async updateRole(id: string, dto: UpdateRoleDto): Promise<RoleWithPermissions> {
    const existing = await this.findRoleById(id);
    const workspaceId = this.getWorkspaceIdOrThrow();

    // System roles have limited editability
    if (existing.isSystem) {
      if (dto.name !== undefined || dto.isDefault !== undefined) {
        throw new BadRequestException('Cannot modify name or default status of system roles');
      }
    }

    // Check for name conflict
    if (dto.name && dto.name !== existing.name) {
      const conflict = await this.prisma.role.findUnique({
        where: { workspaceId_name: { workspaceId, name: dto.name } },
      });

      if (conflict) {
        throw new ConflictException(`Role with name "${dto.name}" already exists`);
      }
    }

    // If setting as default, unset other defaults
    if (dto.isDefault === true) {
      await this.prisma.role.updateMany({
        where: { workspaceId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    // Update role and permissions in a transaction
    const role = await this.prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        },
      });

      // Replace permissions if provided
      if (dto.permissions !== undefined) {
        // Remove existing permissions
        await tx.rolePermission.deleteMany({
          where: { roleId: id },
        });

        // Add new permissions
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

    return role as RoleWithPermissions;
  }

  /**
   * Delete a role
   */
  async deleteRole(id: string): Promise<Role> {
    const role = await this.findRoleById(id);

    // Cannot delete system roles
    if (role.isSystem) {
      throw new BadRequestException('Cannot delete system roles');
    }

    // Check if any members have this role
    const memberCount = await this.prisma.workspaceMember.count({
      where: { roleId: id },
    });

    if (memberCount > 0) {
      throw new BadRequestException(
        `Cannot delete role: ${memberCount} member(s) are assigned to this role`,
      );
    }

    const deleted = await this.delete({ where: { id } });
    return deleted as Role;
  }

  // ==================== PERMISSION MANAGEMENT ====================

  /**
   * Get all available permissions
   */
  async findAllPermissions(): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  /**
   * Get permissions for a specific resource
   */
  async findPermissionsByResource(resource: string): Promise<Permission[]> {
    return this.prisma.permission.findMany({
      where: { resource },
      orderBy: { action: 'asc' },
    });
  }

  /**
   * Create a new permission (admin only)
   */
  async createPermission(dto: CreatePermissionDto): Promise<Permission> {
    // Check for duplicate
    const existing = await this.prisma.permission.findUnique({
      where: { resource_action: { resource: dto.resource, action: dto.action } },
    });

    if (existing) {
      throw new ConflictException(
        `Permission "${dto.resource}:${dto.action}" already exists`,
      );
    }

    return this.prisma.permission.create({
      data: {
        resource: dto.resource,
        action: dto.action,
        description: dto.description,
      },
    });
  }

  /**
   * Add a permission to a role
   */
  async addPermissionToRole(
    roleId: string,
    permissionId: string,
    scope?: string,
    conditions?: Record<string, unknown>,
  ): Promise<RolePermission> {
    const role = await this.findRoleById(roleId);
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    // Check if already assigned
    const existing = await this.prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } },
    });

    if (existing) {
      throw new ConflictException('Permission already assigned to this role');
    }

    return this.prisma.rolePermission.create({
      data: {
        role: { connect: { id: roleId } },
        permission: { connect: { id: permissionId } },
        scope,
        conditions: conditions ? (conditions as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  }

  /**
   * Remove a permission from a role
   */
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    const role = await this.findRoleById(roleId);

    if (role.isSystem) {
      throw new BadRequestException('Cannot modify permissions of system roles');
    }

    await this.prisma.rolePermission.delete({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
  }

  // ==================== MEMBER ROLE ASSIGNMENT ====================

  /**
   * Assign a role to a workspace member
   */
  async assignRoleToMember(memberId: string, roleId: string): Promise<void> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    // Verify member exists and belongs to workspace
    const member = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });

    if (!member) {
      throw new NotFoundException('Workspace member not found');
    }

    // Verify role exists and belongs to workspace
    const role = await this.findRoleById(roleId);

    await this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { roleId },
    });
  }

  /**
   * Remove role from a workspace member
   */
  async removeRoleFromMember(memberId: string): Promise<void> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const member = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });

    if (!member) {
      throw new NotFoundException('Workspace member not found');
    }

    await this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { roleId: null },
    });
  }

  /**
   * Get members with a specific role
   */
  async getMembersByRole(roleId: string): Promise<any[]> {
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

  // ==================== PERMISSION CHECKING ====================

  /**
   * Check if a user has a specific permission
   */
  async hasPermission(
    userId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    // Get the member's role
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

    // Fallback to legacy role check if no roleRef
    if (!member.roleRef) {
      return this.checkLegacyRolePermission(member.role, resource, action);
    }

    // Check for exact permission match
    const hasExact = member.roleRef.permissions.some(
      (rp) => rp.permission.resource === resource && rp.permission.action === action,
    );

    if (hasExact) {
      return true;
    }

    // Check for manage permission (implies all actions)
    const hasManage = member.roleRef.permissions.some(
      (rp) => rp.permission.resource === resource && rp.permission.action === 'manage',
    );

    return hasManage;
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string): Promise<{ resource: string; action: string; scope?: string }[]> {
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

  // ==================== SYSTEM ROLE INITIALIZATION ====================

  /**
   * Initialize system roles and permissions for a workspace
   * Called when a new workspace is created
   */
  async initializeWorkspaceRoles(workspaceId: string): Promise<void> {
    // Ensure all standard permissions exist
    await this.ensureStandardPermissions();

    // Create system roles for the workspace
    for (const [key, config] of Object.entries(SYSTEM_ROLES)) {
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
          isDefault: key === 'VIEWER', // Viewer is default for new members
        },
      });

      // Assign permissions
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

  /**
   * Ensure all standard permissions exist in the database
   */
  async ensureStandardPermissions(): Promise<void> {
    for (const resource of RESOURCES) {
      for (const action of ACTIONS) {
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

  // ==================== PRIVATE HELPERS ====================

  /**
   * Assign multiple permissions to a role (used in transactions)
   */
  private async assignPermissionsToRole(
    roleId: string,
    permissions: PermissionAssignmentDto[],
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    for (const perm of permissions) {
      const permission = await tx.permission.findUnique({
        where: { id: perm.permissionId },
      });

      if (!permission) {
        throw new NotFoundException(`Permission ${perm.permissionId} not found`);
      }

      await tx.rolePermission.create({
        data: {
          role: { connect: { id: roleId } },
          permission: { connect: { id: perm.permissionId } },
          scope: perm.scope,
          conditions: perm.conditions ? (perm.conditions as Prisma.InputJsonValue) : Prisma.JsonNull,
        },
      });
    }
  }

  /**
   * Check permission for legacy role strings (backward compatibility)
   */
  private checkLegacyRolePermission(
    legacyRole: string,
    resource: string,
    action: string,
  ): boolean {
    // Legacy role mapping
    const legacyPermissions: Record<string, { resources: string[]; actions: string[] }> = {
      OWNER: { resources: RESOURCES as unknown as string[], actions: ACTIONS as unknown as string[] },
      ADMIN: { resources: RESOURCES.filter((r) => r !== 'workspace') as unknown as string[], actions: ACTIONS as unknown as string[] },
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
}

import { type Role, type Permission, type RolePermission, Prisma } from '@prisma/client';
import { type CreatePermissionDto } from './dto/create-permission.dto';
import { type CreateRoleDto } from './dto/create-role.dto';
import { type UpdateRoleDto } from './dto/update-role.dto';
import { type PrismaService } from '@/core/database/prisma.service';
import { BaseService } from '@/engine/base.service';
export interface RoleWithPermissions extends Role {
    permissions: (RolePermission & {
        permission: Permission;
    })[];
}
export declare const RESOURCES: readonly ["jobs", "customers", "invoices", "estimates", "technicians", "properties", "parts", "reports", "settings", "roles", "workspace"];
export declare const ACTIONS: readonly ["create", "read", "update", "delete", "manage", "assign"];
export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];
export declare const SYSTEM_ROLES: {
    OWNER: {
        name: string;
        description: string;
        permissions: {
            resource: "workspace" | "properties" | "jobs" | "customers" | "technicians" | "invoices" | "estimates" | "parts" | "roles" | "reports" | "settings";
            action: Action;
        }[];
    };
    ADMIN: {
        name: string;
        description: string;
        permissions: {
            resource: "properties" | "jobs" | "customers" | "technicians" | "invoices" | "estimates" | "parts" | "roles" | "reports" | "settings";
            action: Action;
        }[];
    };
    MANAGER: {
        name: string;
        description: string;
        permissions: {
            resource: Resource;
            action: Action;
        }[];
    };
    DISPATCHER: {
        name: string;
        description: string;
        permissions: {
            resource: Resource;
            action: Action;
        }[];
    };
    TECHNICIAN: {
        name: string;
        description: string;
        permissions: {
            resource: Resource;
            action: Action;
        }[];
    };
    VIEWER: {
        name: string;
        description: string;
        permissions: {
            resource: Resource;
            action: Action;
        }[];
    };
};
export declare class RoleService extends BaseService<Prisma.RoleDelegate> {
    constructor(prisma: PrismaService);
    createRole(dto: CreateRoleDto): Promise<RoleWithPermissions>;
    findAllRoles(): Promise<RoleWithPermissions[]>;
    findRoleById(id: string): Promise<RoleWithPermissions>;
    findRoleByName(name: string): Promise<RoleWithPermissions | null>;
    getDefaultRole(): Promise<RoleWithPermissions | null>;
    updateRole(id: string, dto: UpdateRoleDto): Promise<RoleWithPermissions>;
    deleteRole(id: string): Promise<Role>;
    findAllPermissions(): Promise<Permission[]>;
    findPermissionsByResource(resource: string): Promise<Permission[]>;
    createPermission(dto: CreatePermissionDto): Promise<Permission>;
    addPermissionToRole(roleId: string, permissionId: string, scope?: string, conditions?: Record<string, unknown>): Promise<RolePermission>;
    removePermissionFromRole(roleId: string, permissionId: string): Promise<void>;
    assignRoleToMember(memberId: string, roleId: string): Promise<void>;
    removeRoleFromMember(memberId: string): Promise<void>;
    getMembersByRole(roleId: string): Promise<any[]>;
    hasPermission(userId: string, resource: string, action: string): Promise<boolean>;
    getUserPermissions(userId: string): Promise<{
        resource: string;
        action: string;
        scope?: string;
    }[]>;
    initializeWorkspaceRoles(workspaceId: string): Promise<void>;
    ensureStandardPermissions(): Promise<void>;
    private assignPermissionsToRole;
    private checkLegacyRolePermission;
}

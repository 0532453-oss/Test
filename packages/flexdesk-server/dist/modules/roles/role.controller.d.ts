import { type AssignRoleDto } from './dto/assign-role.dto';
import { type CreatePermissionDto } from './dto/create-permission.dto';
import { type CreateRoleDto } from './dto/create-role.dto';
import { type UpdateRoleDto } from './dto/update-role.dto';
import { type RoleService } from './role.service';
export declare class RoleController {
    private readonly roleService;
    constructor(roleService: RoleService);
    createRole(dto: CreateRoleDto): Promise<import("./role.service").RoleWithPermissions>;
    findAllRoles(): Promise<import("./role.service").RoleWithPermissions[]>;
    getDefaultRole(): Promise<import("./role.service").RoleWithPermissions | null>;
    findRoleById(id: string): Promise<import("./role.service").RoleWithPermissions>;
    findRoleByName(name: string): Promise<import("./role.service").RoleWithPermissions | null>;
    getMembersByRole(id: string): Promise<any[]>;
    updateRole(id: string, dto: UpdateRoleDto): Promise<import("./role.service").RoleWithPermissions>;
    deleteRole(id: string): Promise<void>;
    addPermissionToRole(roleId: string, permissionId: string, scope?: string): Promise<{
        id: string;
        scope: string | null;
        createdAt: Date;
        roleId: string;
        permissionId: string;
        conditions: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    removePermissionFromRole(roleId: string, permissionId: string): Promise<void>;
    assignRoleToMember(dto: AssignRoleDto): Promise<void>;
    removeRoleFromMember(memberId: string): Promise<void>;
    checkPermission(userId: string, resource: string, action: string): Promise<{
        hasPermission: boolean;
    }>;
    getUserPermissions(userId: string): Promise<{
        resource: string;
        action: string;
        scope?: string;
    }[]>;
    initializeWorkspaceRoles(): Promise<void>;
}
export declare class PermissionController {
    private readonly roleService;
    constructor(roleService: RoleService);
    findAllPermissions(): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        resource: string;
        action: string;
    }[]>;
    findPermissionsByResource(resource: string): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        resource: string;
        action: string;
    }[]>;
    createPermission(dto: CreatePermissionDto): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        resource: string;
        action: string;
    }>;
    ensureStandardPermissions(): Promise<void>;
}

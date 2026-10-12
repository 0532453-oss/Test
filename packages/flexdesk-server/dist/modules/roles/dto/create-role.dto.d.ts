export declare class PermissionAssignmentDto {
    permissionId: string;
    scope?: string;
    conditions?: Record<string, unknown>;
}
export declare class CreateRoleDto {
    name: string;
    description?: string;
    isDefault?: boolean;
    permissions?: PermissionAssignmentDto[];
}

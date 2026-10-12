import { PermissionAssignmentDto } from './create-role.dto';
export declare class UpdateRoleDto {
    name?: string;
    description?: string;
    isDefault?: boolean;
    permissions?: PermissionAssignmentDto[];
}

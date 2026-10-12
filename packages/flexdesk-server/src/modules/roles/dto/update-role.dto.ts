import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';

import { PermissionAssignmentDto } from './create-role.dto';

export class UpdateRoleDto {
  @ApiPropertyOptional({ description: 'Role name (must be unique per workspace)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Role description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether this role is auto-assigned to new members' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Permissions to assign (replaces existing permissions)', type: [PermissionAssignmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionAssignmentDto)
  permissions?: PermissionAssignmentDto[];
}

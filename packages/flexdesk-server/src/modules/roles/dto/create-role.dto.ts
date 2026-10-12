import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';

export class PermissionAssignmentDto {
  @ApiProperty({ description: 'Permission ID to assign' })
  @IsString()
  permissionId: string;

  @ApiPropertyOptional({ description: 'Scope restriction: own, team, or null for all' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ description: 'Optional JSON conditions for advanced filtering' })
  @IsOptional()
  conditions?: Record<string, unknown>;
}

export class CreateRoleDto {
  @ApiProperty({ description: 'Role name (must be unique per workspace)' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Role description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Whether this role is auto-assigned to new members', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Permissions to assign to this role', type: [PermissionAssignmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionAssignmentDto)
  permissions?: PermissionAssignmentDto[];
}

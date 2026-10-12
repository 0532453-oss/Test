import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({ description: 'Workspace member ID' })
  @IsString()
  memberId: string;

  @ApiProperty({ description: 'Role ID to assign' })
  @IsString()
  roleId: string;
}

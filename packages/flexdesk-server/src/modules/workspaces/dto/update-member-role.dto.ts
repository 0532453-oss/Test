import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class UpdateMemberRoleDto {
  @ApiProperty({
    description: 'Role to assign to the member',
    enum: ['OWNER', 'ADMIN', 'MEMBER', 'TECHNICIAN'],
  })
  @IsString()
  @IsIn(['OWNER', 'ADMIN', 'MEMBER', 'TECHNICIAN'])
  role: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsIn } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({ description: 'User UUID to add' })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Role to assign',
    enum: ['ADMIN', 'MEMBER', 'TECHNICIAN'],
  })
  @IsString()
  @IsIn(['ADMIN', 'MEMBER', 'TECHNICIAN'])
  role: string;
}

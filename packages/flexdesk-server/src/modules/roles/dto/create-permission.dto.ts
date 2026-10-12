import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ description: 'Resource type (e.g., jobs, customers, invoices)' })
  @IsString()
  resource: string;

  @ApiProperty({ description: 'Action type (e.g., create, read, update, delete, manage)' })
  @IsString()
  action: string;

  @ApiPropertyOptional({ description: 'Permission description' })
  @IsOptional()
  @IsString()
  description?: string;
}

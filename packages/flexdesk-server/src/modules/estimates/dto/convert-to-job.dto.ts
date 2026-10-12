import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class ConvertToJobDto {
  @ApiPropertyOptional({ description: 'Technician UUID to assign' })
  @IsOptional()
  @IsUUID()
  technicianId?: string;

  @ApiPropertyOptional({ description: 'Scheduled date for the job' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

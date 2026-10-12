import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobPriority } from '@prisma/client';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsDateString,
  IsISO8601,
  IsInt,
  IsObject,
  Matches,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';

export class JobLocationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  lat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  lng?: number;
}

export class CreateJobDto {
  @ApiProperty({ description: 'Job title', example: 'HVAC Maintenance' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: 'Job description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ description: 'Customer UUID' })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ description: 'Assigned technician UUID' })
  @IsOptional()
  @IsUUID()
  technicianId?: string;

  @ApiPropertyOptional({ enum: JobPriority, default: 'MEDIUM' })
  @IsOptional()
  @IsEnum(JobPriority)
  priority?: JobPriority;

  @ApiPropertyOptional({ description: 'Scheduled date/time (legacy)' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'Scheduled date (YYYY-MM-DD)', example: '2025-01-30' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'scheduledDate must be YYYY-MM-DD format' })
  scheduledDate?: string;

  @ApiPropertyOptional({ description: 'Scheduled start time (HH:mm)', example: '09:00' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'scheduledStartTime must be HH:mm format' })
  scheduledStartTime?: string;

  @ApiPropertyOptional({ description: 'Scheduled end time (HH:mm)', example: '10:00' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'scheduledEndTime must be HH:mm format' })
  scheduledEndTime?: string;

  @ApiPropertyOptional({ description: 'Assigned technician UUID (alias for technicianId)' })
  @IsOptional()
  @IsUUID()
  assignedTechnicianId?: string;

  @ApiPropertyOptional({ description: 'Estimated duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDuration?: number;

  @ApiPropertyOptional({ description: 'Job location', type: JobLocationDto })
  @IsOptional()
  @IsObject()
  location?: JobLocationDto;
}

export class DateRangeQueryDto {
  @ApiProperty({ description: 'Start date (ISO 8601)', example: '2025-01-01' })
  @IsISO8601({}, { message: 'startDate must be a valid ISO 8601 date string' })
  startDate: string;

  @ApiProperty({ description: 'End date (ISO 8601)', example: '2025-01-31' })
  @IsISO8601({}, { message: 'endDate must be a valid ISO 8601 date string' })
  endDate: string;
}

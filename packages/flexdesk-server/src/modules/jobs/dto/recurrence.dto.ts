import { JobPriority } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsInt,
  IsDate,
  IsOptional,
  IsObject,
  Min,
  Max,
} from 'class-validator';

export enum RecurrenceFrequency {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM',
}

export class CreateTemplateDto {
  @IsString()
  title!: string;

  @IsEnum(RecurrenceFrequency)
  frequency!: RecurrenceFrequency;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  interval: number = 1;

  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @IsString()
  customerId!: string;

  @IsOptional()
  @IsString()
  technicianId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  @Type(() => Number)
  dayOfWeek?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  @Type(() => Number)
  dayOfMonth?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(JobPriority)
  priority?: JobPriority;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  estimatedDuration?: number;

  @IsOptional()
  @IsObject()
  location?: Record<string, any>;
}

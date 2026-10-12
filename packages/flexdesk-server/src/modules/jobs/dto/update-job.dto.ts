import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus } from '@prisma/client';
import { IsOptional, IsEnum } from 'class-validator';

import { CreateJobDto } from './create-job.dto';

export class UpdateJobDto extends PartialType(
  OmitType(CreateJobDto, ['customerId'] as const),
) {
  @ApiPropertyOptional({ enum: JobStatus, description: 'Job status' })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}

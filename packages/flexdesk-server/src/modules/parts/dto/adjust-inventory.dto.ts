import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class AdjustInventoryDto {
  @ApiProperty({ description: 'Inventory adjustment amount (positive or negative)', example: -5 })
  @IsInt()
  adjustment: number;

  @ApiPropertyOptional({ description: 'Reason for inventory adjustment', example: 'Used on job #1234' })
  @IsOptional()
  @IsString()
  reason?: string;
}

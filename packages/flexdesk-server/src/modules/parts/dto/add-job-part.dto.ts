import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';

export class AddJobPartDto {
  @ApiProperty({ description: 'Part ID', example: 'part-uuid-123' })
  @IsString()
  partId: string;

  @ApiProperty({ description: 'Quantity used', example: 2 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  quantity: number;

  @ApiPropertyOptional({ description: 'Override unit price (defaults to part price)', example: 30.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ description: 'Notes about part usage', example: 'Replaced faulty capacitor' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

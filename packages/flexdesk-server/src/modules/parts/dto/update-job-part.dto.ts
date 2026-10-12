import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class UpdateJobPartDto {
  @ApiPropertyOptional({ description: 'Updated quantity', example: 3 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0.01)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Updated unit price', example: 35.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ description: 'Updated notes', example: 'Additional work required' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

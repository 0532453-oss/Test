import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';

export class CreatePartDto {
  @ApiPropertyOptional({ description: 'Stock Keeping Unit (SKU)', example: 'HVAC-CAP-001' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  sku?: string;

  @ApiProperty({ description: 'Part name', example: '30/5 MFD Dual Run Capacitor' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Part description', example: 'Dual run capacitor for HVAC systems' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Part category', example: 'HVAC' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @ApiProperty({ description: 'Cost to business per unit', example: 12.50 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitCost: number;

  @ApiProperty({ description: 'Price charged to customer per unit', example: 25.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Current quantity in stock', example: 50, default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  quantityOnHand?: number;

  @ApiPropertyOptional({ description: 'Reorder point threshold', example: 10, default: 5 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  reorderPoint?: number;

  @ApiPropertyOptional({ description: 'Default reorder quantity', example: 20, default: 10 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  reorderQuantity?: number;

  @ApiPropertyOptional({ description: 'Whether the part is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

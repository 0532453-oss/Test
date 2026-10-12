import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class UpdatePropertyDto {
  @ApiPropertyOptional({ description: 'Property name (e.g., "Main Office", "Home")' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Whether this is the primary service location' })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({ description: 'Street address' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  street?: string;

  @ApiPropertyOptional({ description: 'Apartment, suite, or unit number' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  street2?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'State or province' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  state?: string;

  @ApiPropertyOptional({ description: 'ZIP or postal code' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  zip?: string;

  @ApiPropertyOptional({ description: 'Country code' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  country?: string;

  @ApiPropertyOptional({ description: 'Latitude for geolocation' })
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude for geolocation' })
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiPropertyOptional({ description: 'Access notes (gate codes, parking info)' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  accessNotes?: string;

  @ApiPropertyOptional({ description: 'Service notes (equipment on-site, special instructions)' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  serviceNotes?: string;
}

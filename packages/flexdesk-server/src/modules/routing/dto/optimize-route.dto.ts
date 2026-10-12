import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';

export class LocationDto {
  @ApiProperty({ description: 'Latitude', example: 37.7749 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ description: 'Longitude', example: -122.4194 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

export class WaypointDto {
  @ApiProperty({ description: 'Unique identifier for the waypoint', example: 'job-123' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Location coordinates' })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiPropertyOptional({ description: 'Waypoint name', example: 'Johnson Residence' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Address string', example: '123 Main St, San Francisco, CA' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Estimated duration at this stop in minutes', example: 60 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedDurationMinutes?: number;

  @ApiPropertyOptional({ description: 'Time window start (ISO date string)' })
  @IsDateString()
  @IsOptional()
  timeWindowStart?: string;

  @ApiPropertyOptional({ description: 'Time window end (ISO date string)' })
  @IsDateString()
  @IsOptional()
  timeWindowEnd?: string;
}

export class OptimizeRouteDto {
  @ApiProperty({ description: 'Starting point for the route' })
  @ValidateNested()
  @Type(() => WaypointDto)
  origin: WaypointDto;

  @ApiProperty({ description: 'Waypoints to optimize', type: [WaypointDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WaypointDto)
  waypoints: WaypointDto[];

  @ApiPropertyOptional({ description: 'End point (defaults to origin if not provided)' })
  @ValidateNested()
  @Type(() => WaypointDto)
  @IsOptional()
  destination?: WaypointDto;
}

export class OptimizeTechnicianRouteDto {
  @ApiProperty({ description: 'Technician user ID', example: 'user-123' })
  @IsString()
  @IsNotEmpty()
  technicianId: string;

  @ApiProperty({ description: 'Date to optimize route for (ISO date string)', example: '2024-01-15' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Override technician start location' })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  startLocation?: LocationDto;
}

export class GetDirectionsDto {
  @ApiProperty({ description: 'Origin location' })
  @ValidateNested()
  @Type(() => LocationDto)
  origin: LocationDto;

  @ApiProperty({ description: 'Destination location' })
  @ValidateNested()
  @Type(() => LocationDto)
  destination: LocationDto;
}

export class DistanceMatrixDto {
  @ApiProperty({ description: 'Origin locations', type: [LocationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationDto)
  origins: LocationDto[];

  @ApiProperty({ description: 'Destination locations', type: [LocationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationDto)
  destinations: LocationDto[];
}

/**
 * Next Job Response DTO
 *
 * Returns information about the technician's next scheduled job
 * including travel time estimation from Google Distance Matrix API
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JobLocationDto {
  @ApiProperty({ description: 'Street address' })
  address?: string;

  @ApiProperty({ description: 'Latitude coordinate', example: 40.7128 })
  lat: number;

  @ApiProperty({ description: 'Longitude coordinate', example: -74.006 })
  lng: number;
}

export class NextJobResponseDto {
  @ApiProperty({ description: 'Job ID', format: 'uuid' })
  jobId: string;

  @ApiProperty({ description: 'Customer name' })
  customerName: string;

  @ApiProperty({ description: 'Job title' })
  title: string;

  @ApiPropertyOptional({ description: 'Job address' })
  address?: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate' })
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate' })
  lng?: number;

  @ApiProperty({ description: 'Scheduled start time (ISO 8601)' })
  scheduledAt: string;

  @ApiPropertyOptional({
    description: 'Estimated travel time in minutes from Google Distance Matrix API',
  })
  travelTimeMinutes?: number;

  @ApiPropertyOptional({
    description: 'Travel distance in meters',
  })
  travelDistanceMeters?: number;

  @ApiProperty({
    description: 'Minutes until job starts (can be negative if past start time)',
  })
  minutesUntilStart: number;

  @ApiProperty({
    description: 'Google Maps directions URL',
    example: 'https://www.google.com/maps/dir/?api=1&destination=40.7128,-74.006&travelmode=driving',
  })
  directionsUrl: string;

  @ApiProperty({
    description: 'Whether the technician is currently working on another job',
  })
  hasJobInProgress: boolean;

  @ApiPropertyOptional({
    description: 'ID of the job currently in progress (if any)',
  })
  inProgressJobId?: string;
}

export class NoNextJobResponseDto {
  @ApiProperty({ description: 'Indicates no upcoming job', example: false })
  hasNextJob: false;

  @ApiProperty({ description: 'Human-readable message' })
  message: string;

  @ApiProperty({
    description: 'Whether the technician is currently working on a job',
  })
  hasJobInProgress: boolean;

  @ApiPropertyOptional({
    description: 'ID of the job currently in progress (if any)',
  })
  inProgressJobId?: string;
}

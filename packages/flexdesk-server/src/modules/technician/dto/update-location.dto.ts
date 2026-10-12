import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';

export class UpdateLocationDto {
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

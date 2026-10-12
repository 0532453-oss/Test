import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleAvailabilityDto {
  @ApiProperty({ description: 'Whether the technician is available', example: true })
  @IsBoolean()
  isAvailable: boolean;
}

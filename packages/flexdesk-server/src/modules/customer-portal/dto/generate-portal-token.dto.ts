import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsInt, Min, Max, IsOptional } from 'class-validator';

export class GeneratePortalTokenDto {
  @ApiProperty({ description: 'Customer UUID' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'Workspace UUID' })
  @IsUUID()
  workspaceId: string;

  @ApiPropertyOptional({
    description: 'Token expiry in days (default: 30, max: 365)',
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  expiryDays?: number;
}

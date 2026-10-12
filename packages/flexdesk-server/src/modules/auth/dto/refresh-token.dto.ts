import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token (optional if sent via httpOnly cookie)', required: false })
  @IsString()
  @IsOptional()
  refresh_token?: string;
}

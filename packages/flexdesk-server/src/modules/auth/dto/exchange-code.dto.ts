import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ExchangeCodeDto {
  @ApiProperty({ description: 'One-time authorization code from OAuth callback' })
  @IsString()
  code: string;
}

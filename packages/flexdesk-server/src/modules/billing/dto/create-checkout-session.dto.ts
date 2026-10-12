import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsIn, IsUrl, IsOptional } from 'class-validator';

export class CreateCheckoutSessionDto {
  @ApiProperty({
    description: 'Subscription tier ID',
    example: 'pro',
    enum: ['pro'],
  })
  @IsString()
  @IsIn(['pro'], { message: 'Only "pro" tier is available for checkout' })
  tierId: string;

  @ApiProperty({
    description: 'Billing interval',
    example: 'month',
    enum: ['month', 'year'],
  })
  @IsString()
  @IsIn(['month', 'year'])
  interval: 'month' | 'year';

  @ApiPropertyOptional({
    description: 'Customer email address (optional - Stripe will collect if not provided)',
    example: 'customer@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'URL to redirect to after successful checkout',
    example: 'https://flexdesk.io/checkout/success',
  })
  @IsUrl({ require_tld: false }) // Allow localhost for development
  successUrl: string;

  @ApiProperty({
    description: 'URL to redirect to if checkout is cancelled',
    example: 'https://flexdesk.io/pricing',
  })
  @IsUrl({ require_tld: false }) // Allow localhost for development
  cancelUrl: string;
}

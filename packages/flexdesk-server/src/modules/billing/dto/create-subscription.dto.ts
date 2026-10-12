import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsIn } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Subscription tier ID', example: 'pro' })
  @IsString()
  tierId: string;

  @ApiProperty({
    description: 'Billing interval',
    example: 'month',
    enum: ['month', 'year'],
  })
  @IsString()
  @IsIn(['month', 'year'])
  interval: 'month' | 'year';

  @ApiProperty({ description: 'Customer email address', example: 'customer@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Stripe payment method ID' })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}

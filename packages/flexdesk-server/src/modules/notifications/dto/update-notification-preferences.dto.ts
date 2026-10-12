import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Matches, Min, Max } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({ description: 'Enable email notifications' })
  @IsBoolean()
  @IsOptional()
  emailEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable SMS notifications' })
  @IsBoolean()
  @IsOptional()
  smsEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable push notifications' })
  @IsBoolean()
  @IsOptional()
  pushEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Notify when technician is dispatched' })
  @IsBoolean()
  @IsOptional()
  jobDispatched?: boolean;

  @ApiPropertyOptional({ description: 'Remind before scheduled job' })
  @IsBoolean()
  @IsOptional()
  jobReminder?: boolean;

  @ApiPropertyOptional({ description: 'Notify when job is completed' })
  @IsBoolean()
  @IsOptional()
  jobCompleted?: boolean;

  @ApiPropertyOptional({ description: 'Notify when invoice is sent' })
  @IsBoolean()
  @IsOptional()
  invoiceSent?: boolean;

  @ApiPropertyOptional({ description: 'Confirm when payment is received' })
  @IsBoolean()
  @IsOptional()
  paymentReceived?: boolean;

  @ApiPropertyOptional({ description: 'Notify when estimate is sent' })
  @IsBoolean()
  @IsOptional()
  estimateSent?: boolean;

  @ApiPropertyOptional({ description: 'Follow up on pending estimates' })
  @IsBoolean()
  @IsOptional()
  estimateFollowUp?: boolean;

  @ApiPropertyOptional({ description: 'Receive promotional/marketing messages' })
  @IsBoolean()
  @IsOptional()
  marketingMessages?: boolean;

  @ApiPropertyOptional({ description: 'Hours before job to send reminder (1-168)', minimum: 1, maximum: 168 })
  @IsInt()
  @Min(1)
  @Max(168)
  @IsOptional()
  reminderHoursBefore?: number;

  @ApiPropertyOptional({ description: 'Quiet hours start time (24h format, e.g., "21:00")', example: '21:00' })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'quietHoursStart must be in 24h format (HH:mm)',
  })
  @IsOptional()
  quietHoursStart?: string;

  @ApiPropertyOptional({ description: 'Quiet hours end time (24h format, e.g., "08:00")', example: '08:00' })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'quietHoursEnd must be in 24h format (HH:mm)',
  })
  @IsOptional()
  quietHoursEnd?: string;
}

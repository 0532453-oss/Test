import { Module, Global } from '@nestjs/common';

import { NotificationPreferenceController } from './notification-preference.controller';
import { NotificationService } from './notification.service';

/**
 * Notification Module
 *
 * Handles all notification operations:
 * - Email notifications via SendGrid
 * - SMS notifications via Twilio
 * - Customer notification preferences
 *
 * This module is marked as @Global() so NotificationService
 * is available throughout the application without explicit imports.
 */
@Global()
@Module({
  controllers: [NotificationPreferenceController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}

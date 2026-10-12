import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  NotFoundException,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { type UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { NotificationService } from './notification.service';

import { PrismaService } from '@/core/database/prisma.service';
import { getWorkspaceId } from '@/core/database/workspace-context';

@ApiTags('notification-preferences')
@ApiBearerAuth()
@Controller('notification-preferences')
export class NotificationPreferenceController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  private getWorkspaceIdOrThrow(): string {
    const workspaceId = getWorkspaceId();

    if (!workspaceId) {
      throw new BadRequestException('Workspace context is required');
    }

    return workspaceId;
  }

  @Get(':customerId')
  @ApiOperation({ summary: 'Get notification preferences for a customer' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Customer notification preferences' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async getPreferences(@Param('customerId', ParseUUIDPipe) customerId: string) {
    const workspaceId = this.getWorkspaceIdOrThrow();

    // Verify customer belongs to workspace
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, workspaceId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const preferences = await this.notificationService.getCustomerPreferences(customerId);

    return {
      customerId,
      preferences,
    };
  }

  @Put(':customerId')
  @ApiOperation({ summary: 'Update notification preferences for a customer' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async updatePreferences(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    const workspaceId = this.getWorkspaceIdOrThrow();

    // Verify customer belongs to workspace
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, workspaceId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Validate quiet hours make sense
    if (dto.quietHoursStart && dto.quietHoursEnd) {
      if (dto.quietHoursStart === dto.quietHoursEnd) {
        throw new BadRequestException('Quiet hours start and end cannot be the same');
      }
    }

    const preferences = await this.notificationService.upsertCustomerPreferences(customerId, dto);

    return {
      customerId,
      preferences,
    };
  }

  @Get(':customerId/check/:notificationType/:channel')
  @ApiOperation({ summary: 'Check if a specific notification is enabled for a customer' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiParam({ name: 'notificationType', description: 'Type of notification (e.g., jobDispatched, invoiceSent)' })
  @ApiParam({ name: 'channel', description: 'Channel (email, sms, push)' })
  @ApiResponse({ status: 200, description: 'Returns whether the notification is enabled' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async checkNotificationEnabled(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Param('notificationType') notificationType: string,
    @Param('channel') channel: 'email' | 'sms' | 'push',
  ) {
    const workspaceId = this.getWorkspaceIdOrThrow();

    // Verify customer belongs to workspace
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, workspaceId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Validate notification type
    const validNotificationTypes = [
      'jobDispatched',
      'jobReminder',
      'jobCompleted',
      'invoiceSent',
      'paymentReceived',
      'estimateSent',
      'estimateFollowUp',
      'marketingMessages',
    ];

    if (!validNotificationTypes.includes(notificationType)) {
      throw new BadRequestException(`Invalid notification type. Valid types: ${validNotificationTypes.join(', ')}`);
    }

    // Validate channel
    const validChannels = ['email', 'sms', 'push'];
    if (!validChannels.includes(channel)) {
      throw new BadRequestException(`Invalid channel. Valid channels: ${validChannels.join(', ')}`);
    }

    const isEnabled = await this.notificationService.isNotificationEnabled(
      customerId,
      notificationType as any,
      channel,
    );

    return {
      customerId,
      notificationType,
      channel,
      enabled: isEnabled,
    };
  }
}

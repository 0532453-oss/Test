"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationPreferenceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const workspace_context_1 = require("../../core/database/workspace-context");
let NotificationPreferenceController = class NotificationPreferenceController {
    constructor(notificationService, prisma) {
        this.notificationService = notificationService;
        this.prisma = prisma;
    }
    getWorkspaceIdOrThrow() {
        const workspaceId = (0, workspace_context_1.getWorkspaceId)();
        if (!workspaceId) {
            throw new common_1.BadRequestException('Workspace context is required');
        }
        return workspaceId;
    }
    async getPreferences(customerId) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const customer = await this.prisma.customer.findFirst({
            where: { id: customerId, workspaceId },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
        const preferences = await this.notificationService.getCustomerPreferences(customerId);
        return {
            customerId,
            preferences,
        };
    }
    async updatePreferences(customerId, dto) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const customer = await this.prisma.customer.findFirst({
            where: { id: customerId, workspaceId },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
        if (dto.quietHoursStart && dto.quietHoursEnd) {
            if (dto.quietHoursStart === dto.quietHoursEnd) {
                throw new common_1.BadRequestException('Quiet hours start and end cannot be the same');
            }
        }
        const preferences = await this.notificationService.upsertCustomerPreferences(customerId, dto);
        return {
            customerId,
            preferences,
        };
    }
    async checkNotificationEnabled(customerId, notificationType, channel) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const customer = await this.prisma.customer.findFirst({
            where: { id: customerId, workspaceId },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
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
            throw new common_1.BadRequestException(`Invalid notification type. Valid types: ${validNotificationTypes.join(', ')}`);
        }
        const validChannels = ['email', 'sms', 'push'];
        if (!validChannels.includes(channel)) {
            throw new common_1.BadRequestException(`Invalid channel. Valid channels: ${validChannels.join(', ')}`);
        }
        const isEnabled = await this.notificationService.isNotificationEnabled(customerId, notificationType, channel);
        return {
            customerId,
            notificationType,
            channel,
            enabled: isEnabled,
        };
    }
};
exports.NotificationPreferenceController = NotificationPreferenceController;
__decorate([
    (0, common_1.Get)(':customerId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get notification preferences for a customer' }),
    (0, swagger_1.ApiParam)({ name: 'customerId', description: 'Customer ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Customer notification preferences' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Customer not found' }),
    __param(0, (0, common_1.Param)('customerId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationPreferenceController.prototype, "getPreferences", null);
__decorate([
    (0, common_1.Put)(':customerId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update notification preferences for a customer' }),
    (0, swagger_1.ApiParam)({ name: 'customerId', description: 'Customer ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Preferences updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Customer not found' }),
    __param(0, (0, common_1.Param)('customerId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], NotificationPreferenceController.prototype, "updatePreferences", null);
__decorate([
    (0, common_1.Get)(':customerId/check/:notificationType/:channel'),
    (0, swagger_1.ApiOperation)({ summary: 'Check if a specific notification is enabled for a customer' }),
    (0, swagger_1.ApiParam)({ name: 'customerId', description: 'Customer ID' }),
    (0, swagger_1.ApiParam)({ name: 'notificationType', description: 'Type of notification (e.g., jobDispatched, invoiceSent)' }),
    (0, swagger_1.ApiParam)({ name: 'channel', description: 'Channel (email, sms, push)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns whether the notification is enabled' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Customer not found' }),
    __param(0, (0, common_1.Param)('customerId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('notificationType')),
    __param(2, (0, common_1.Param)('channel')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], NotificationPreferenceController.prototype, "checkNotificationEnabled", null);
exports.NotificationPreferenceController = NotificationPreferenceController = __decorate([
    (0, swagger_1.ApiTags)('notification-preferences'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('notification-preferences'),
    __metadata("design:paramtypes", [Function, Function])
], NotificationPreferenceController);

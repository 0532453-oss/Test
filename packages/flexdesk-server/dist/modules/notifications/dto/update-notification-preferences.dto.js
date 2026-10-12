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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateNotificationPreferencesDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateNotificationPreferencesDto {
}
exports.UpdateNotificationPreferencesDto = UpdateNotificationPreferencesDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Enable email notifications' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "emailEnabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Enable SMS notifications' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "smsEnabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Enable push notifications' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "pushEnabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Notify when technician is dispatched' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "jobDispatched", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Remind before scheduled job' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "jobReminder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Notify when job is completed' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "jobCompleted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Notify when invoice is sent' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "invoiceSent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Confirm when payment is received' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "paymentReceived", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Notify when estimate is sent' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "estimateSent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Follow up on pending estimates' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "estimateFollowUp", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Receive promotional/marketing messages' }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "marketingMessages", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Hours before job to send reminder (1-168)', minimum: 1, maximum: 168 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(168),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateNotificationPreferencesDto.prototype, "reminderHoursBefore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Quiet hours start time (24h format, e.g., "21:00")', example: '21:00' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'quietHoursStart must be in 24h format (HH:mm)',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateNotificationPreferencesDto.prototype, "quietHoursStart", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Quiet hours end time (24h format, e.g., "08:00")', example: '08:00' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'quietHoursEnd must be in 24h format (HH:mm)',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateNotificationPreferencesDto.prototype, "quietHoursEnd", void 0);

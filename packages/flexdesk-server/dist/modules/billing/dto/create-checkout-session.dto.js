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
exports.CreateCheckoutSessionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateCheckoutSessionDto {
}
exports.CreateCheckoutSessionDto = CreateCheckoutSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Subscription tier ID',
        example: 'pro',
        enum: ['pro'],
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['pro'], { message: 'Only "pro" tier is available for checkout' }),
    __metadata("design:type", String)
], CreateCheckoutSessionDto.prototype, "tierId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Billing interval',
        example: 'month',
        enum: ['month', 'year'],
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['month', 'year']),
    __metadata("design:type", String)
], CreateCheckoutSessionDto.prototype, "interval", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Customer email address (optional - Stripe will collect if not provided)',
        example: 'customer@example.com',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateCheckoutSessionDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'URL to redirect to after successful checkout',
        example: 'https://flexdesk.io/checkout/success',
    }),
    (0, class_validator_1.IsUrl)({ require_tld: false }),
    __metadata("design:type", String)
], CreateCheckoutSessionDto.prototype, "successUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'URL to redirect to if checkout is cancelled',
        example: 'https://flexdesk.io/pricing',
    }),
    (0, class_validator_1.IsUrl)({ require_tld: false }),
    __metadata("design:type", String)
], CreateCheckoutSessionDto.prototype, "cancelUrl", void 0);

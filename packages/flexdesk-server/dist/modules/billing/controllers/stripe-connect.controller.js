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
exports.StripeConnectController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let StripeConnectController = class StripeConnectController {
    constructor(stripeConnectService) {
        this.stripeConnectService = stripeConnectService;
    }
    async createOnboardingLink(technicianId) {
        return this.stripeConnectService.createOnboardingLink(technicianId);
    }
    async getAccountStatus(technicianId) {
        return this.stripeConnectService.getAccountStatus(technicianId);
    }
};
exports.StripeConnectController = StripeConnectController;
__decorate([
    (0, common_1.Post)('onboard/:technicianId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Create Stripe Express account and onboarding link for a service provider',
        description: 'Creates a Stripe Express account (if not already created) for the specified technician and generates an account link URL for the Stripe-hosted onboarding UI.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'technicianId',
        description: 'The ID of the technician/service provider to onboard',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Onboarding link created successfully',
        schema: {
            type: 'object',
            properties: {
                accountId: { type: 'string', example: 'acct_1234567890' },
                onboardingUrl: { type: 'string', example: 'https://connect.stripe.com/setup/...' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Stripe not configured or invalid request' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Technician not found' }),
    __param(0, (0, common_1.Param)('technicianId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StripeConnectController.prototype, "createOnboardingLink", null);
__decorate([
    (0, common_1.Get)('account/:technicianId/status'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Stripe account status for a service provider',
        description: 'Retrieves the current Stripe account status including whether charges are enabled and onboarding is complete.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'technicianId',
        description: 'The ID of the technician/service provider',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Account status retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                accountId: { type: 'string', example: 'acct_1234567890' },
                chargesEnabled: { type: 'boolean', example: true },
                payoutsEnabled: { type: 'boolean', example: true },
                detailsSubmitted: { type: 'boolean', example: true },
                onboardingComplete: { type: 'boolean', example: true },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Technician has not started onboarding' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Technician not found' }),
    __param(0, (0, common_1.Param)('technicianId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StripeConnectController.prototype, "getAccountStatus", null);
exports.StripeConnectController = StripeConnectController = __decorate([
    (0, swagger_1.ApiTags)('stripe-connect'),
    (0, common_1.Controller)('stripe'),
    __metadata("design:paramtypes", [Function])
], StripeConnectController);

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
exports.StripeSubscriptionController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../../auth/decorators/public.decorator");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
let StripeSubscriptionController = class StripeSubscriptionController {
    constructor(stripeSubscriptionService) {
        this.stripeSubscriptionService = stripeSubscriptionService;
    }
    async getSubscriptionTiers() {
        return this.stripeSubscriptionService.getSubscriptionTiers();
    }
    async getSubscriptionTier(tierId) {
        const tier = this.stripeSubscriptionService.getSubscriptionTier(tierId);
        if (!tier) {
            throw new Error(`Subscription tier ${tierId} not found`);
        }
        return tier;
    }
    async createCheckoutSession(dto) {
        return this.stripeSubscriptionService.createCheckoutSession(dto.tierId, dto.interval, dto.successUrl, dto.cancelUrl, dto.email);
    }
    async getSubscriptionProducts() {
        return this.stripeSubscriptionService.getSubscriptionProductsWithPrices();
    }
    async initializeProducts() {
        return this.stripeSubscriptionService.initializeSubscriptionProducts();
    }
    async getPriceId(tierId, interval = 'month') {
        const priceId = await this.stripeSubscriptionService.getPriceId(tierId, interval);
        return { priceId };
    }
    async createSubscription(workspaceId, dto) {
        const subscription = await this.stripeSubscriptionService.createSubscription(workspaceId, dto.tierId, dto.interval, dto.email, dto.paymentMethodId);
        const tier = this.stripeSubscriptionService.getSubscriptionTier(dto.tierId);
        let clientSecret;
        const latestInvoice = subscription.latest_invoice;
        if (latestInvoice &&
            typeof latestInvoice === 'object' &&
            'payment_intent' in latestInvoice) {
            const paymentIntent = latestInvoice.payment_intent;
            if (paymentIntent && typeof paymentIntent === 'object' && 'client_secret' in paymentIntent) {
                clientSecret = paymentIntent.client_secret;
            }
        }
        return {
            subscriptionId: subscription.id,
            status: subscription.status,
            clientSecret,
            tier: tier,
            interval: dto.interval,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        };
    }
    async getWorkspaceSubscription(workspaceId) {
        return this.stripeSubscriptionService.getWorkspaceSubscription(workspaceId);
    }
    async cancelSubscription(workspaceId, immediate) {
        const cancelAtPeriodEnd = immediate !== 'true';
        await this.stripeSubscriptionService.cancelSubscription(workspaceId, cancelAtPeriodEnd);
        return {
            message: cancelAtPeriodEnd
                ? 'Subscription will be canceled at the end of the billing period'
                : 'Subscription has been canceled immediately',
            cancelAtPeriodEnd,
        };
    }
    async createBillingPortalSession(workspaceId, dto) {
        const session = await this.stripeSubscriptionService.createBillingPortalSession(workspaceId, dto.returnUrl);
        return { url: session.url };
    }
};
exports.StripeSubscriptionController = StripeSubscriptionController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('tiers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StripeSubscriptionController.prototype, "getSubscriptionTiers", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('tiers/:tierId'),
    __param(0, (0, common_1.Param)('tierId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StripeSubscriptionController.prototype, "getSubscriptionTier", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('create-checkout-session'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], StripeSubscriptionController.prototype, "createCheckoutSession", null);
__decorate([
    (0, common_1.Get)('products'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StripeSubscriptionController.prototype, "getSubscriptionProducts", null);
__decorate([
    (0, common_1.Post)('products/initialize'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StripeSubscriptionController.prototype, "initializeProducts", null);
__decorate([
    (0, common_1.Get)('price/:tierId'),
    __param(0, (0, common_1.Param)('tierId')),
    __param(1, (0, common_1.Query)('interval')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StripeSubscriptionController.prototype, "getPriceId", null);
__decorate([
    (0, common_1.Post)('workspace/:workspaceId/subscribe'),
    (0, roles_decorator_1.Roles)('OWNER', 'ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Param)('workspaceId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], StripeSubscriptionController.prototype, "createSubscription", null);
__decorate([
    (0, common_1.Get)('workspace/:workspaceId/subscription'),
    __param(0, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StripeSubscriptionController.prototype, "getWorkspaceSubscription", null);
__decorate([
    (0, common_1.Delete)('workspace/:workspaceId/subscription'),
    (0, roles_decorator_1.Roles)('OWNER', 'ADMIN'),
    __param(0, (0, common_1.Param)('workspaceId')),
    __param(1, (0, common_1.Query)('immediate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StripeSubscriptionController.prototype, "cancelSubscription", null);
__decorate([
    (0, common_1.Post)('workspace/:workspaceId/billing-portal'),
    (0, roles_decorator_1.Roles)('OWNER', 'ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('workspaceId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], StripeSubscriptionController.prototype, "createBillingPortalSession", null);
exports.StripeSubscriptionController = StripeSubscriptionController = __decorate([
    (0, common_1.Controller)('api/v1/subscriptions'),
    __metadata("design:paramtypes", [Function])
], StripeSubscriptionController);

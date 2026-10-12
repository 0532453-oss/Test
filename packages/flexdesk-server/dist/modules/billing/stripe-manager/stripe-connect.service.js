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
var StripeConnectService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeConnectService = void 0;
const common_1 = require("@nestjs/common");
const stripe_1 = require("stripe");
const workspace_context_1 = require("../../../core/database/workspace-context");
let StripeConnectService = StripeConnectService_1 = class StripeConnectService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(StripeConnectService_1.name);
        const secretKey = this.configService.get('stripe.secretKey');
        if (secretKey) {
            this.stripe = new stripe_1.default(secretKey);
        }
        else {
            this.stripe = null;
            this.logger.warn('Stripe secret key not configured. Stripe Connect features will be disabled.');
        }
    }
    getWorkspaceIdOrThrow() {
        const workspaceId = (0, workspace_context_1.getWorkspaceId)();
        if (!workspaceId) {
            throw new common_1.BadRequestException('Workspace context is required');
        }
        return workspaceId;
    }
    ensureStripeConfigured() {
        if (!this.stripe) {
            throw new common_1.ServiceUnavailableException('Billing not configured');
        }
        return this.stripe;
    }
    async createOnboardingLink(technicianId) {
        const stripe = this.ensureStripeConfigured();
        const workspaceId = this.getWorkspaceIdOrThrow();
        const technician = await this.prisma.technician.findFirst({
            where: { id: technicianId, workspaceId },
            include: { user: true },
        });
        if (!technician) {
            throw new common_1.NotFoundException('Technician not found');
        }
        let stripeAccountId = technician.stripeAccountId;
        if (!stripeAccountId) {
            this.logger.log(`Creating Stripe Express account for technician ${technicianId}`);
            const account = await stripe.accounts.create({
                type: 'express',
                email: technician.user.email,
                metadata: {
                    technicianId: technician.id,
                    workspaceId: workspaceId,
                },
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
            });
            stripeAccountId = account.id;
            await this.prisma.technician.update({
                where: { id: technicianId },
                data: {
                    stripeAccountId: account.id,
                    stripeChargesEnabled: account.charges_enabled,
                    stripeOnboardingComplete: account.details_submitted,
                },
            });
            this.logger.log(`Created Stripe Express account ${account.id} for technician ${technicianId}`);
        }
        const publicAppUrl = this.configService.get('app.publicAppUrl') || 'http://localhost:3000';
        const accountLink = await stripe.accountLinks.create({
            account: stripeAccountId,
            refresh_url: `${publicAppUrl}/provider/onboarding/refresh?technicianId=${technicianId}`,
            return_url: `${publicAppUrl}/provider/onboarding/complete?technicianId=${technicianId}`,
            type: 'account_onboarding',
        });
        this.logger.log(`Generated onboarding link for technician ${technicianId}`);
        return {
            accountId: stripeAccountId,
            onboardingUrl: accountLink.url,
        };
    }
    async getAccountStatus(technicianId) {
        const stripe = this.ensureStripeConfigured();
        const workspaceId = this.getWorkspaceIdOrThrow();
        const technician = await this.prisma.technician.findFirst({
            where: { id: technicianId, workspaceId },
        });
        if (!technician) {
            throw new common_1.NotFoundException('Technician not found');
        }
        if (!technician.stripeAccountId) {
            throw new common_1.BadRequestException('Technician has not started Stripe onboarding');
        }
        const account = await stripe.accounts.retrieve(technician.stripeAccountId);
        await this.prisma.technician.update({
            where: { id: technicianId },
            data: {
                stripeChargesEnabled: account.charges_enabled,
                stripeOnboardingComplete: account.details_submitted,
            },
        });
        return {
            accountId: account.id,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled || false,
            detailsSubmitted: account.details_submitted || false,
            onboardingComplete: account.details_submitted && account.charges_enabled,
        };
    }
    async handleAccountUpdated(account) {
        const technicianId = account.metadata?.technicianId;
        if (!technicianId) {
            this.logger.warn(`Received account.updated for account ${account.id} without technicianId metadata`);
            return;
        }
        const technician = await this.prisma.technician.findFirst({
            where: { stripeAccountId: account.id },
        });
        if (!technician) {
            this.logger.warn(`Technician not found for Stripe account ${account.id}`);
            return;
        }
        await this.prisma.technician.update({
            where: { id: technician.id },
            data: {
                stripeChargesEnabled: account.charges_enabled,
                stripeOnboardingComplete: account.details_submitted,
            },
        });
        this.logger.log(`Updated technician ${technician.id} Stripe status: charges_enabled=${account.charges_enabled}, details_submitted=${account.details_submitted}`);
    }
};
exports.StripeConnectService = StripeConnectService;
exports.StripeConnectService = StripeConnectService = StripeConnectService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function, Function])
], StripeConnectService);

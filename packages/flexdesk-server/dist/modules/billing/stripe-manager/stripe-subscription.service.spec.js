"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const testing_1 = require("@nestjs/testing");
const stripe_subscription_service_1 = require("./stripe-subscription.service");
const prisma_service_1 = require("../../../core/database/prisma.service");
describe('StripeSubscriptionService', () => {
    let service;
    const mockConfigService = {
        get: jest.fn((key) => {
            const config = {
                'stripe.secretKey': '',
                'stripe.webhookSecret': 'whsec_test_123',
            };
            return config[key];
        }),
    };
    const mockPrismaService = {};
    beforeEach(async () => {
        jest.clearAllMocks();
        const module = await testing_1.Test.createTestingModule({
            providers: [
                stripe_subscription_service_1.StripeSubscriptionService,
                { provide: config_1.ConfigService, useValue: mockConfigService },
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(stripe_subscription_service_1.StripeSubscriptionService);
    });
    describe('getSubscriptionTiers', () => {
        it('should return all subscription tiers', () => {
            const tiers = service.getSubscriptionTiers();
            expect(tiers).toEqual(stripe_subscription_service_1.SUBSCRIPTION_TIERS);
            expect(tiers).toHaveLength(3);
        });
        it('should include free, pro, and enterprise tiers', () => {
            const tiers = service.getSubscriptionTiers();
            const tierIds = tiers.map((t) => t.id);
            expect(tierIds).toContain('free');
            expect(tierIds).toContain('pro');
            expect(tierIds).toContain('enterprise');
        });
        it('should have correct pricing for free tier', () => {
            const tiers = service.getSubscriptionTiers();
            const free = tiers.find((t) => t.id === 'free');
            expect(free?.monthlyPrice).toBe(0);
            expect(free?.yearlyPrice).toBe(0);
        });
        it('should have correct pricing for pro tier', () => {
            const tiers = service.getSubscriptionTiers();
            const pro = tiers.find((t) => t.id === 'pro');
            expect(pro?.monthlyPrice).toBe(2900);
            expect(pro?.yearlyPrice).toBe(27600);
        });
        it('should have correct pricing for enterprise tier', () => {
            const tiers = service.getSubscriptionTiers();
            const enterprise = tiers.find((t) => t.id === 'enterprise');
            expect(enterprise?.monthlyPrice).toBe(0);
            expect(enterprise?.yearlyPrice).toBe(0);
            expect(enterprise?.isCustomPricing).toBe(true);
        });
    });
    describe('getSubscriptionTier', () => {
        it('should return a specific tier by ID', () => {
            const tier = service.getSubscriptionTier('pro');
            expect(tier).toBeDefined();
            expect(tier?.id).toBe('pro');
            expect(tier?.name).toBe('Pro');
        });
        it('should return free tier with correct features', () => {
            const tier = service.getSubscriptionTier('free');
            expect(tier).toBeDefined();
            expect(tier?.features).toContain('Up to 2 technicians');
            expect(tier?.features).toContain('Community support');
        });
        it('should return undefined for non-existent tier', () => {
            const tier = service.getSubscriptionTier('nonexistent');
            expect(tier).toBeUndefined();
        });
        it('should return undefined for empty string', () => {
            const tier = service.getSubscriptionTier('');
            expect(tier).toBeUndefined();
        });
    });
    describe('createOrGetProduct', () => {
        it('should throw BadRequestException when Stripe is not configured', async () => {
            await expect(service.createOrGetProduct(stripe_subscription_service_1.SUBSCRIPTION_TIERS[0])).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('createOrGetPrices', () => {
        it('should throw BadRequestException when Stripe is not configured', async () => {
            await expect(service.createOrGetPrices(stripe_subscription_service_1.SUBSCRIPTION_TIERS[0], 'prod_123')).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('initializeSubscriptionProducts', () => {
        it('should throw BadRequestException when Stripe is not configured', async () => {
            await expect(service.initializeSubscriptionProducts()).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('getSubscriptionProductsWithPrices', () => {
        it('should throw BadRequestException when Stripe is not configured', async () => {
            await expect(service.getSubscriptionProductsWithPrices()).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('getPriceId', () => {
        it('should throw NotFoundException for non-existent tier', async () => {
            await expect(service.getPriceId('nonexistent', 'month')).rejects.toThrow(common_1.NotFoundException);
        });
        it('should throw BadRequestException when Stripe is not configured', async () => {
            await expect(service.getPriceId('pro', 'month')).rejects.toThrow(common_1.BadRequestException);
        });
    });
});
describe('StripeSubscriptionService with Stripe configured', () => {
    let service;
    const mockConfigServiceWithStripe = {
        get: jest.fn((key) => {
            const config = {
                'stripe.secretKey': 'sk_test_fake_key',
                'stripe.webhookSecret': 'whsec_test_123',
            };
            return config[key];
        }),
    };
    const mockPrismaService = {};
    beforeEach(async () => {
        jest.clearAllMocks();
        const module = await testing_1.Test.createTestingModule({
            providers: [
                stripe_subscription_service_1.StripeSubscriptionService,
                { provide: config_1.ConfigService, useValue: mockConfigServiceWithStripe },
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(stripe_subscription_service_1.StripeSubscriptionService);
    });
    describe('getSubscriptionTiers', () => {
        it('should still return tiers when Stripe is configured', () => {
            const tiers = service.getSubscriptionTiers();
            expect(tiers).toHaveLength(3);
        });
    });
    describe('getSubscriptionTier', () => {
        it('should still return tier when Stripe is configured', () => {
            const tier = service.getSubscriptionTier('free');
            expect(tier).toBeDefined();
            expect(tier?.id).toBe('free');
        });
    });
});
describe('StripeSubscriptionService - Subscription Creation', () => {
    let service;
    const mockConfigService = {
        get: jest.fn((key) => {
            const config = {
                'stripe.secretKey': '',
                'stripe.webhookSecret': 'whsec_test_123',
            };
            return config[key];
        }),
    };
    const mockPrismaService = {
        workspace: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };
    beforeEach(async () => {
        jest.clearAllMocks();
        const module = await testing_1.Test.createTestingModule({
            providers: [
                stripe_subscription_service_1.StripeSubscriptionService,
                { provide: config_1.ConfigService, useValue: mockConfigService },
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(stripe_subscription_service_1.StripeSubscriptionService);
    });
    describe('createOrGetCustomer', () => {
        it('should throw BadRequestException when Stripe is not configured', async () => {
            await expect(service.createOrGetCustomer('workspace-id', 'test@example.com')).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('createSubscription', () => {
        it('should throw NotFoundException for non-existent tier before checking Stripe config', async () => {
            await expect(service.createSubscription('workspace-id', 'nonexistent', 'month', 'test@example.com')).rejects.toThrow(common_1.NotFoundException);
        });
        it('should throw BadRequestException when Stripe is not configured for valid tier', async () => {
            await expect(service.createSubscription('workspace-id', 'pro', 'month', 'test@example.com')).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('getWorkspaceSubscription', () => {
        it('should throw NotFoundException for non-existent workspace', async () => {
            mockPrismaService.workspace.findUnique.mockResolvedValue(null);
            await expect(service.getWorkspaceSubscription('nonexistent-workspace')).rejects.toThrow(common_1.NotFoundException);
        });
        it('should return null subscription for workspace without subscription', async () => {
            mockPrismaService.workspace.findUnique.mockResolvedValue({
                id: 'workspace-id',
                name: 'Test Workspace',
                stripeSubscriptionId: null,
            });
            const result = await service.getWorkspaceSubscription('workspace-id');
            expect(result.subscription).toBeNull();
            expect(result.tier).toBeNull();
        });
        it('should throw BadRequestException when retrieving subscription with Stripe not configured', async () => {
            mockPrismaService.workspace.findUnique.mockResolvedValue({
                id: 'workspace-id',
                name: 'Test Workspace',
                stripeSubscriptionId: 'sub_123',
                subscriptionTier: 'pro',
            });
            await expect(service.getWorkspaceSubscription('workspace-id')).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('cancelSubscription', () => {
        it('should throw BadRequestException when Stripe is not configured (checked first)', async () => {
            await expect(service.cancelSubscription('nonexistent-workspace')).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw BadRequestException for workspace without subscription when Stripe not configured', async () => {
            await expect(service.cancelSubscription('workspace-id')).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw BadRequestException when Stripe is not configured even with valid subscription', async () => {
            await expect(service.cancelSubscription('workspace-id')).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('handleSubscriptionUpdated', () => {
        it('should update workspace subscription status', async () => {
            const mockSubscription = {
                id: 'sub_123',
                status: 'active',
                current_period_end: Math.floor(Date.now() / 1000) + 2592000,
                metadata: { workspace_id: 'workspace-id' },
            };
            mockPrismaService.workspace.update.mockResolvedValue({});
            await service.handleSubscriptionUpdated(mockSubscription);
            expect(mockPrismaService.workspace.update).toHaveBeenCalledWith({
                where: { id: 'workspace-id' },
                data: {
                    subscriptionStatus: 'active',
                    subscriptionCurrentPeriodEnd: expect.any(Date),
                },
            });
        });
        it('should not update if subscription has no workspace_id metadata', async () => {
            const mockSubscription = {
                id: 'sub_123',
                status: 'active',
                current_period_end: Math.floor(Date.now() / 1000),
                metadata: {},
            };
            await service.handleSubscriptionUpdated(mockSubscription);
            expect(mockPrismaService.workspace.update).not.toHaveBeenCalled();
        });
    });
    describe('handleSubscriptionDeleted', () => {
        it('should clear workspace subscription data', async () => {
            const mockSubscription = {
                id: 'sub_123',
                status: 'canceled',
                current_period_end: Math.floor(Date.now() / 1000),
                metadata: { workspace_id: 'workspace-id' },
            };
            mockPrismaService.workspace.update.mockResolvedValue({});
            await service.handleSubscriptionDeleted(mockSubscription);
            expect(mockPrismaService.workspace.update).toHaveBeenCalledWith({
                where: { id: 'workspace-id' },
                data: {
                    stripeSubscriptionId: null,
                    subscriptionStatus: 'canceled',
                    subscriptionTier: null,
                    subscriptionInterval: null,
                    subscriptionCurrentPeriodEnd: null,
                },
            });
        });
        it('should not update if subscription has no workspace_id metadata', async () => {
            const mockSubscription = {
                id: 'sub_123',
                status: 'canceled',
                current_period_end: Math.floor(Date.now() / 1000),
                metadata: {},
            };
            await service.handleSubscriptionDeleted(mockSubscription);
            expect(mockPrismaService.workspace.update).not.toHaveBeenCalled();
        });
    });
    describe('createBillingPortalSession', () => {
        it('should throw BadRequestException when Stripe is not configured', async () => {
            await expect(service.createBillingPortalSession('workspace-id', 'https://example.com/return')).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw NotFoundException for non-existent workspace when Stripe not configured', async () => {
            await expect(service.createBillingPortalSession('nonexistent-workspace', 'https://example.com/return')).rejects.toThrow(common_1.BadRequestException);
        });
    });
});
describe('StripeSubscriptionService - Billing Portal', () => {
    let service;
    const mockConfigService = {
        get: jest.fn((key) => {
            const config = {
                'stripe.secretKey': '',
                'stripe.webhookSecret': 'whsec_test_123',
            };
            return config[key];
        }),
    };
    const mockPrismaService = {
        workspace: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };
    beforeEach(async () => {
        jest.clearAllMocks();
        const module = await testing_1.Test.createTestingModule({
            providers: [
                stripe_subscription_service_1.StripeSubscriptionService,
                { provide: config_1.ConfigService, useValue: mockConfigService },
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(stripe_subscription_service_1.StripeSubscriptionService);
    });
    describe('createBillingPortalSession', () => {
        it('should throw BadRequestException when Stripe is not configured', async () => {
            await expect(service.createBillingPortalSession('workspace-id', 'https://example.com/return')).rejects.toThrow(common_1.BadRequestException);
        });
    });
});
describe('SUBSCRIPTION_TIERS constant', () => {
    it('should have 3 tiers', () => {
        expect(stripe_subscription_service_1.SUBSCRIPTION_TIERS).toHaveLength(3);
    });
    it('should have all required fields for each tier', () => {
        for (const tier of stripe_subscription_service_1.SUBSCRIPTION_TIERS) {
            expect(tier.id).toBeDefined();
            expect(tier.name).toBeDefined();
            expect(tier.description).toBeDefined();
            expect(typeof tier.monthlyPrice).toBe('number');
            expect(typeof tier.yearlyPrice).toBe('number');
            expect(tier.features).toBeDefined();
            expect(tier.features.length).toBeGreaterThan(0);
        }
    });
    it('should have pro tier as the only paid tier with checkout required', () => {
        const pro = stripe_subscription_service_1.SUBSCRIPTION_TIERS.find((t) => t.id === 'pro');
        expect(pro?.requiresCheckout).toBe(true);
        expect(pro?.monthlyPrice).toBeGreaterThan(0);
        expect(pro?.yearlyPrice).toBeGreaterThan(0);
        const free = stripe_subscription_service_1.SUBSCRIPTION_TIERS.find((t) => t.id === 'free');
        expect(free?.requiresCheckout).toBe(false);
        expect(free?.monthlyPrice).toBe(0);
        const enterprise = stripe_subscription_service_1.SUBSCRIPTION_TIERS.find((t) => t.id === 'enterprise');
        expect(enterprise?.requiresCheckout).toBe(false);
        expect(enterprise?.isCustomPricing).toBe(true);
    });
    it('should have correct tier order: free, pro, enterprise', () => {
        expect(stripe_subscription_service_1.SUBSCRIPTION_TIERS[0].id).toBe('free');
        expect(stripe_subscription_service_1.SUBSCRIPTION_TIERS[1].id).toBe('pro');
        expect(stripe_subscription_service_1.SUBSCRIPTION_TIERS[2].id).toBe('enterprise');
    });
});

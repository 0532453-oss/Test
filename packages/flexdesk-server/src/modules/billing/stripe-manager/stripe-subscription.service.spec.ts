import { BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';

import {
  StripeSubscriptionService,
  SUBSCRIPTION_TIERS,
} from './stripe-subscription.service';

import { PrismaService } from '@/core/database/prisma.service';

describe('StripeSubscriptionService', () => {
  let service: StripeSubscriptionService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'stripe.secretKey': '',
        'stripe.webhookSecret': 'whsec_test_123',
      };
      return config[key];
    }),
  };

  const mockPrismaService = {};

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeSubscriptionService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<StripeSubscriptionService>(StripeSubscriptionService);
  });

  describe('getSubscriptionTiers', () => {
    it('should return all subscription tiers', () => {
      const tiers = service.getSubscriptionTiers();
      expect(tiers).toEqual(SUBSCRIPTION_TIERS);
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
      expect(pro?.monthlyPrice).toBe(2900); // $29/month
      expect(pro?.yearlyPrice).toBe(27600); // $23/month billed annually
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
    it('should throw ServiceUnavailableException when Stripe is not configured', async () => {
      await expect(
        service.createOrGetProduct(SUBSCRIPTION_TIERS[0]),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('createOrGetPrices', () => {
    it('should throw ServiceUnavailableException when Stripe is not configured', async () => {
      await expect(
        service.createOrGetPrices(SUBSCRIPTION_TIERS[0], 'prod_123'),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('initializeSubscriptionProducts', () => {
    it('should throw ServiceUnavailableException when Stripe is not configured', async () => {
      await expect(
        service.initializeSubscriptionProducts(),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('getSubscriptionProductsWithPrices', () => {
    it('should throw ServiceUnavailableException when Stripe is not configured', async () => {
      await expect(
        service.getSubscriptionProductsWithPrices(),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('getPriceId', () => {
    it('should throw NotFoundException for non-existent tier', async () => {
      await expect(service.getPriceId('nonexistent', 'month')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ServiceUnavailableException when Stripe is not configured', async () => {
      await expect(service.getPriceId('pro', 'month')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });
});

describe('StripeSubscriptionService with Stripe configured', () => {
  let service: StripeSubscriptionService;

  const mockConfigServiceWithStripe = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'stripe.secretKey': 'sk_test_fake_key',
        'stripe.webhookSecret': 'whsec_test_123',
      };
      return config[key];
    }),
  };

  const mockPrismaService = {};

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeSubscriptionService,
        { provide: ConfigService, useValue: mockConfigServiceWithStripe },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<StripeSubscriptionService>(StripeSubscriptionService);
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
  let service: StripeSubscriptionService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeSubscriptionService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<StripeSubscriptionService>(StripeSubscriptionService);
  });

  describe('createOrGetCustomer', () => {
    it('should throw ServiceUnavailableException when Stripe is not configured', async () => {
      await expect(
        service.createOrGetCustomer('workspace-id', 'test@example.com'),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('createSubscription', () => {
    it('should throw NotFoundException for non-existent tier before checking Stripe config', async () => {
      // Note: Tier validation happens first, but Stripe is checked when getting customer
      // Since the tier doesn't exist, we expect NotFoundException
      await expect(
        service.createSubscription(
          'workspace-id',
          'nonexistent',
          'month',
          'test@example.com',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ServiceUnavailableException when Stripe is not configured for valid tier', async () => {
      await expect(
        service.createSubscription(
          'workspace-id',
          'pro',
          'month',
          'test@example.com',
        ),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('getWorkspaceSubscription', () => {
    it('should throw NotFoundException for non-existent workspace', async () => {
      (mockPrismaService.workspace.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.getWorkspaceSubscription('nonexistent-workspace'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return null subscription for workspace without subscription', async () => {
      (mockPrismaService.workspace.findUnique as jest.Mock).mockResolvedValue({
        id: 'workspace-id',
        name: 'Test Workspace',
        stripeSubscriptionId: null,
      });

      const result = await service.getWorkspaceSubscription('workspace-id');
      expect(result.subscription).toBeNull();
      expect(result.tier).toBeNull();
    });

    it('should throw ServiceUnavailableException when retrieving subscription with Stripe not configured', async () => {
      (mockPrismaService.workspace.findUnique as jest.Mock).mockResolvedValue({
        id: 'workspace-id',
        name: 'Test Workspace',
        stripeSubscriptionId: 'sub_123',
        subscriptionTier: 'pro',
      });

      // Should throw because Stripe is not configured
      await expect(
        service.getWorkspaceSubscription('workspace-id'),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('cancelSubscription', () => {
    it('should throw ServiceUnavailableException when Stripe is not configured (checked first)', async () => {
      // Stripe configuration is checked before workspace lookup
      await expect(
        service.cancelSubscription('nonexistent-workspace'),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('should throw ServiceUnavailableException for workspace without subscription when Stripe not configured', async () => {
      // This test shows that Stripe check happens before workspace validation
      await expect(
        service.cancelSubscription('workspace-id'),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('should throw ServiceUnavailableException when Stripe is not configured even with valid subscription', async () => {
      // Stripe configuration is always checked first
      await expect(
        service.cancelSubscription('workspace-id'),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('handleSubscriptionUpdated', () => {
    it('should update workspace subscription status', async () => {
      const mockSubscription = {
        id: 'sub_123',
        status: 'active',
        current_period_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days from now
        metadata: { workspace_id: 'workspace-id' },
      } as any;

      (mockPrismaService.workspace.update as jest.Mock).mockResolvedValue({});

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
      } as any;

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
      } as any;

      (mockPrismaService.workspace.update as jest.Mock).mockResolvedValue({});

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
      } as any;

      await service.handleSubscriptionDeleted(mockSubscription);

      expect(mockPrismaService.workspace.update).not.toHaveBeenCalled();
    });
  });

  describe('createBillingPortalSession', () => {
    it('should throw ServiceUnavailableException when Stripe is not configured', async () => {
      await expect(
        service.createBillingPortalSession('workspace-id', 'https://example.com/return'),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('should throw ServiceUnavailableException for non-existent workspace when Stripe not configured', async () => {
      // Stripe check happens first, so we get ServiceUnavailableException
      await expect(
        service.createBillingPortalSession('nonexistent-workspace', 'https://example.com/return'),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });
});

describe('StripeSubscriptionService - Billing Portal', () => {
  let service: StripeSubscriptionService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeSubscriptionService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<StripeSubscriptionService>(StripeSubscriptionService);
  });

  describe('createBillingPortalSession', () => {
    it('should throw ServiceUnavailableException when Stripe is not configured', async () => {
      await expect(
        service.createBillingPortalSession('workspace-id', 'https://example.com/return'),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });
});

describe('SUBSCRIPTION_TIERS constant', () => {
  it('should have 3 tiers', () => {
    expect(SUBSCRIPTION_TIERS).toHaveLength(3);
  });

  it('should have all required fields for each tier', () => {
    for (const tier of SUBSCRIPTION_TIERS) {
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
    const pro = SUBSCRIPTION_TIERS.find((t) => t.id === 'pro');
    expect(pro?.requiresCheckout).toBe(true);
    expect(pro?.monthlyPrice).toBeGreaterThan(0);
    expect(pro?.yearlyPrice).toBeGreaterThan(0);

    const free = SUBSCRIPTION_TIERS.find((t) => t.id === 'free');
    expect(free?.requiresCheckout).toBe(false);
    expect(free?.monthlyPrice).toBe(0);

    const enterprise = SUBSCRIPTION_TIERS.find((t) => t.id === 'enterprise');
    expect(enterprise?.requiresCheckout).toBe(false);
    expect(enterprise?.isCustomPricing).toBe(true);
  });

  it('should have correct tier order: free, pro, enterprise', () => {
    expect(SUBSCRIPTION_TIERS[0].id).toBe('free');
    expect(SUBSCRIPTION_TIERS[1].id).toBe('pro');
    expect(SUBSCRIPTION_TIERS[2].id).toBe('enterprise');
  });
});

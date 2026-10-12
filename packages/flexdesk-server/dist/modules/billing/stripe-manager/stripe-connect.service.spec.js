"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const testing_1 = require("@nestjs/testing");
const stripe_connect_service_1 = require("./stripe-connect.service");
const prisma_service_1 = require("../../../core/database/prisma.service");
const workspaceContext = require("../../../core/database/workspace-context");
jest.mock('@/core/database/workspace-context', () => ({
    getWorkspaceId: jest.fn(),
}));
describe('StripeConnectService', () => {
    let service;
    let prisma;
    let configService;
    const mockWorkspaceId = 'workspace-123';
    const mockTechnicianId = 'technician-456';
    const mockStripeAccountId = 'acct_test123';
    const mockTechnician = {
        id: mockTechnicianId,
        workspaceId: mockWorkspaceId,
        userId: 'user-789',
        stripeAccountId: null,
        stripeChargesEnabled: false,
        stripeOnboardingComplete: false,
        user: {
            id: 'user-789',
            email: 'provider@example.com',
            firstName: 'John',
            lastName: 'Doe',
        },
    };
    const mockTechnicianWithStripe = {
        ...mockTechnician,
        stripeAccountId: mockStripeAccountId,
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                stripe_connect_service_1.StripeConnectService,
                {
                    provide: config_1.ConfigService,
                    useValue: {
                        get: jest.fn((key) => {
                            if (key === 'stripe.secretKey')
                                return 'sk_test_fake_key';
                            if (key === 'app.publicAppUrl')
                                return 'http://localhost:3000';
                            return null;
                        }),
                    },
                },
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: {
                        technician: {
                            findFirst: jest.fn(),
                            update: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();
        service = module.get(stripe_connect_service_1.StripeConnectService);
        prisma = module.get(prisma_service_1.PrismaService);
        configService = module.get(config_1.ConfigService);
        jest.clearAllMocks();
        workspaceContext.getWorkspaceId.mockReturnValue(mockWorkspaceId);
    });
    describe('constructor', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });
        it('should initialize Stripe client when secret key is configured', () => {
            expect(service).toBeDefined();
        });
    });
    describe('createOnboardingLink', () => {
        it('should throw BadRequestException when workspace context is missing', async () => {
            workspaceContext.getWorkspaceId.mockReturnValue(null);
            await expect(service.createOnboardingLink(mockTechnicianId)).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw NotFoundException when technician is not found', async () => {
            prisma.technician.findFirst.mockResolvedValue(null);
            await expect(service.createOnboardingLink(mockTechnicianId)).rejects.toThrow(common_1.NotFoundException);
            expect(prisma.technician.findFirst).toHaveBeenCalledWith({
                where: { id: mockTechnicianId, workspaceId: mockWorkspaceId },
                include: { user: true },
            });
        });
    });
    describe('getAccountStatus', () => {
        it('should throw BadRequestException when workspace context is missing', async () => {
            workspaceContext.getWorkspaceId.mockReturnValue(null);
            await expect(service.getAccountStatus(mockTechnicianId)).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw NotFoundException when technician is not found', async () => {
            prisma.technician.findFirst.mockResolvedValue(null);
            await expect(service.getAccountStatus(mockTechnicianId)).rejects.toThrow(common_1.NotFoundException);
        });
        it('should throw BadRequestException when technician has not started onboarding', async () => {
            prisma.technician.findFirst.mockResolvedValue(mockTechnician);
            await expect(service.getAccountStatus(mockTechnicianId)).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('handleAccountUpdated', () => {
        it('should log warning when account has no technicianId metadata', async () => {
            const mockAccount = {
                id: mockStripeAccountId,
                charges_enabled: true,
                details_submitted: true,
                metadata: {},
            };
            await expect(service.handleAccountUpdated(mockAccount)).resolves.not.toThrow();
        });
        it('should log warning when technician is not found for account', async () => {
            const mockAccount = {
                id: mockStripeAccountId,
                charges_enabled: true,
                details_submitted: true,
                metadata: { technicianId: mockTechnicianId },
            };
            prisma.technician.findFirst.mockResolvedValue(null);
            await expect(service.handleAccountUpdated(mockAccount)).resolves.not.toThrow();
        });
        it('should update technician when account is found', async () => {
            const mockAccount = {
                id: mockStripeAccountId,
                charges_enabled: true,
                details_submitted: true,
                metadata: { technicianId: mockTechnicianId },
            };
            prisma.technician.findFirst.mockResolvedValue(mockTechnicianWithStripe);
            prisma.technician.update.mockResolvedValue({
                ...mockTechnicianWithStripe,
                stripeChargesEnabled: true,
                stripeOnboardingComplete: true,
            });
            await service.handleAccountUpdated(mockAccount);
            expect(prisma.technician.update).toHaveBeenCalledWith({
                where: { id: mockTechnicianId },
                data: {
                    stripeChargesEnabled: true,
                    stripeOnboardingComplete: true,
                },
            });
        });
    });
});

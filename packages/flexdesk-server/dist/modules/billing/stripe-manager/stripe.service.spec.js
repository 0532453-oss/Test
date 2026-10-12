"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const testing_1 = require("@nestjs/testing");
const client_1 = require("@prisma/client");
const stripe_connect_service_1 = require("./stripe-connect.service");
const stripe_service_1 = require("./stripe.service");
const prisma_service_1 = require("../../../core/database/prisma.service");
const workspaceContext = require("../../../core/database/workspace-context");
const notification_service_1 = require("../../notifications/notification.service");
describe('StripeService', () => {
    let service;
    const mockWorkspaceId = 'workspace-123';
    const mockInvoiceId = 'invoice-123';
    const mockCustomerId = 'customer-123';
    const mockInvoice = {
        id: mockInvoiceId,
        workspaceId: mockWorkspaceId,
        customerId: mockCustomerId,
        invoiceNumber: 'INV-20240115-ABC123',
        status: client_1.InvoiceStatus.DRAFT,
        amount: new client_1.Prisma.Decimal(100),
        tax: new client_1.Prisma.Decimal(10),
        total: new client_1.Prisma.Decimal(110),
        customer: {
            id: mockCustomerId,
            email: 'customer@example.com',
        },
    };
    const mockPrismaService = {
        invoice: {
            findFirst: jest.fn(),
            update: jest.fn(),
        },
    };
    const mockConfigService = {
        get: jest.fn((key) => {
            const config = {
                'stripe.secretKey': '',
                'stripe.webhookSecret': 'whsec_test',
                'app.publicAppUrl': 'http://localhost:3000',
            };
            return config[key];
        }),
    };
    const mockNotificationService = {
        notifyInvoiceSent: jest.fn().mockResolvedValue({ success: true, channel: 'email' }),
        notifyPaymentReceived: jest.fn().mockResolvedValue({ success: true, channel: 'email' }),
    };
    const mockStripeConnectService = {
        handleAccountUpdated: jest.fn().mockResolvedValue(undefined),
    };
    beforeEach(async () => {
        jest.spyOn(workspaceContext, 'getWorkspaceId').mockReturnValue(mockWorkspaceId);
        const module = await testing_1.Test.createTestingModule({
            providers: [
                stripe_service_1.StripeService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: config_1.ConfigService, useValue: mockConfigService },
                { provide: notification_service_1.NotificationService, useValue: mockNotificationService },
                { provide: stripe_connect_service_1.StripeConnectService, useValue: mockStripeConnectService },
            ],
        }).compile();
        service = module.get(stripe_service_1.StripeService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('createPaymentLink', () => {
        it('should throw BadRequestException when Stripe is not configured', async () => {
            mockPrismaService.invoice.findFirst.mockResolvedValue(mockInvoice);
            await expect(service.createPaymentLink(mockInvoiceId)).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw BadRequestException without workspace context', async () => {
            jest.spyOn(workspaceContext, 'getWorkspaceId').mockReturnValue(null);
            await expect(service.createPaymentLink(mockInvoiceId)).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('getPaymentStatus', () => {
        it('should throw BadRequestException when Stripe is not configured', async () => {
            await expect(service.getPaymentStatus('pi_test')).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('handleWebhook', () => {
        it('should throw BadRequestException when Stripe is not configured', async () => {
            const payload = Buffer.from('{}');
            const signature = 'sig_test';
            await expect(service.handleWebhook(payload, signature)).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('createPaymentLinkForPortal', () => {
        it('should throw BadRequestException when Stripe is not configured', async () => {
            await expect(service.createPaymentLinkForPortal(mockInvoiceId, mockCustomerId, mockWorkspaceId)).rejects.toThrow(common_1.BadRequestException);
        });
    });
});
describe('StripeService with Stripe configured', () => {
    let service;
    const mockWorkspaceId = 'workspace-123';
    const mockInvoiceId = 'invoice-123';
    const mockCustomerId = 'customer-123';
    const mockInvoice = {
        id: mockInvoiceId,
        workspaceId: mockWorkspaceId,
        customerId: mockCustomerId,
        invoiceNumber: 'INV-20240115-ABC123',
        status: client_1.InvoiceStatus.DRAFT,
        amount: new client_1.Prisma.Decimal(100),
        tax: new client_1.Prisma.Decimal(10),
        total: new client_1.Prisma.Decimal(110),
        customer: {
            id: mockCustomerId,
            email: 'customer@example.com',
        },
    };
    const mockPrismaService = {
        invoice: {
            findFirst: jest.fn(),
            update: jest.fn(),
        },
    };
    const mockConfigServiceWithStripe = {
        get: jest.fn((key) => {
            const config = {
                'stripe.secretKey': 'sk_test_fake_key',
                'stripe.webhookSecret': 'whsec_test',
                'app.publicAppUrl': 'http://localhost:3000',
            };
            return config[key];
        }),
    };
    const mockNotificationServiceWithStripe = {
        notifyInvoiceSent: jest.fn().mockResolvedValue({ success: true, channel: 'email' }),
        notifyPaymentReceived: jest.fn().mockResolvedValue({ success: true, channel: 'email' }),
    };
    const mockStripeConnectServiceWithStripe = {
        handleAccountUpdated: jest.fn().mockResolvedValue(undefined),
    };
    beforeEach(async () => {
        jest.spyOn(workspaceContext, 'getWorkspaceId').mockReturnValue(mockWorkspaceId);
        const module = await testing_1.Test.createTestingModule({
            providers: [
                stripe_service_1.StripeService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: config_1.ConfigService, useValue: mockConfigServiceWithStripe },
                { provide: notification_service_1.NotificationService, useValue: mockNotificationServiceWithStripe },
                { provide: stripe_connect_service_1.StripeConnectService, useValue: mockStripeConnectServiceWithStripe },
            ],
        }).compile();
        service = module.get(stripe_service_1.StripeService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('createPaymentLink', () => {
        it('should throw NotFoundException when invoice not found', async () => {
            mockPrismaService.invoice.findFirst.mockResolvedValue(null);
            await expect(service.createPaymentLink(mockInvoiceId)).rejects.toThrow(common_1.NotFoundException);
        });
        it('should throw BadRequestException when invoice already paid', async () => {
            mockPrismaService.invoice.findFirst.mockResolvedValue({
                ...mockInvoice,
                status: client_1.InvoiceStatus.PAID,
            });
            await expect(service.createPaymentLink(mockInvoiceId)).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw BadRequestException when invoice cancelled', async () => {
            mockPrismaService.invoice.findFirst.mockResolvedValue({
                ...mockInvoice,
                status: client_1.InvoiceStatus.CANCELLED,
            });
            await expect(service.createPaymentLink(mockInvoiceId)).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('createPaymentLinkForPortal', () => {
        it('should throw NotFoundException when invoice not found', async () => {
            mockPrismaService.invoice.findFirst.mockResolvedValue(null);
            await expect(service.createPaymentLinkForPortal(mockInvoiceId, mockCustomerId, mockWorkspaceId)).rejects.toThrow(common_1.NotFoundException);
        });
        it('should throw BadRequestException when invoice already paid', async () => {
            mockPrismaService.invoice.findFirst.mockResolvedValue({
                ...mockInvoice,
                status: client_1.InvoiceStatus.PAID,
            });
            await expect(service.createPaymentLinkForPortal(mockInvoiceId, mockCustomerId, mockWorkspaceId)).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw BadRequestException when invoice cancelled', async () => {
            mockPrismaService.invoice.findFirst.mockResolvedValue({
                ...mockInvoice,
                status: client_1.InvoiceStatus.CANCELLED,
            });
            await expect(service.createPaymentLinkForPortal(mockInvoiceId, mockCustomerId, mockWorkspaceId)).rejects.toThrow(common_1.BadRequestException);
        });
        it('should query invoice with customerId filter for security', async () => {
            mockPrismaService.invoice.findFirst.mockResolvedValue(null);
            try {
                await service.createPaymentLinkForPortal(mockInvoiceId, mockCustomerId, mockWorkspaceId);
            }
            catch {
            }
            expect(mockPrismaService.invoice.findFirst).toHaveBeenCalledWith({
                where: { id: mockInvoiceId, customerId: mockCustomerId, workspaceId: mockWorkspaceId },
                include: { customer: true },
            });
        });
    });
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const client_1 = require("@prisma/client");
const customer_portal_service_1 = require("./customer-portal.service");
const prisma_service_1 = require("../../core/database/prisma.service");
const stripe_service_1 = require("../billing/stripe-manager/stripe.service");
const crypto = require("../../utils/crypto");
jest.mock('@/utils/crypto', () => ({
    signCustomerPortalToken: jest.fn(),
    verifyCustomerPortalToken: jest.fn(),
}));
describe('CustomerPortalService', () => {
    let service;
    let prisma;
    let stripeService;
    const mockCustomer = {
        id: 'customer-uuid',
        workspaceId: 'workspace-uuid',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: 'SYNCED',
        syncVersion: 0,
    };
    const mockJob = {
        id: 'job-uuid',
        workspaceId: 'workspace-uuid',
        customerId: 'customer-uuid',
        title: 'HVAC Repair',
        description: 'Air conditioner not cooling',
        status: client_1.JobStatus.COMPLETED,
        scheduledAt: new Date('2024-01-15T10:00:00Z'),
        completedAt: new Date('2024-01-15T12:00:00Z'),
        technicianId: 'tech-uuid',
        technician: {
            id: 'tech-uuid',
            user: {
                firstName: 'Jane',
                lastName: 'Smith',
            },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const mockInvoice = {
        id: 'invoice-uuid',
        workspaceId: 'workspace-uuid',
        customerId: 'customer-uuid',
        jobId: 'job-uuid',
        invoiceNumber: 'INV-20240115-ABC123',
        status: client_1.InvoiceStatus.SENT,
        amount: { toString: () => '100.00' },
        tax: { toString: () => '10.00' },
        total: { toString: () => '110.00' },
        dueDate: new Date('2024-02-15'),
        paidAt: null,
        createdAt: new Date(),
        job: {
            id: 'job-uuid',
            title: 'HVAC Repair',
        },
        lineItems: [
            {
                description: 'Service for job: HVAC Repair',
                quantity: { toString: () => '1' },
                unitPrice: { toString: () => '100.00' },
                total: { toString: () => '100.00' },
            },
        ],
    };
    beforeEach(async () => {
        const mockPrismaService = {
            customer: {
                findFirst: jest.fn(),
            },
            job: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
            },
            invoice: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
            },
        };
        const mockStripeService = {
            createPaymentLinkForPortal: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                customer_portal_service_1.CustomerPortalService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: stripe_service_1.StripeService,
                    useValue: mockStripeService,
                },
            ],
        }).compile();
        service = module.get(customer_portal_service_1.CustomerPortalService);
        prisma = module.get(prisma_service_1.PrismaService);
        stripeService = module.get(stripe_service_1.StripeService);
        jest.clearAllMocks();
    });
    describe('generatePortalToken', () => {
        it('should generate a token for valid customer', async () => {
            prisma.customer.findFirst = jest.fn().mockResolvedValue(mockCustomer);
            crypto.signCustomerPortalToken.mockReturnValue('mock-token');
            const result = await service.generatePortalToken('customer-uuid', 'workspace-uuid');
            expect(prisma.customer.findFirst).toHaveBeenCalledWith({
                where: { id: 'customer-uuid', workspaceId: 'workspace-uuid' },
            });
            expect(crypto.signCustomerPortalToken).toHaveBeenCalled();
            expect(result.token).toBe('mock-token');
            expect(result.expiresAt).toBeInstanceOf(Date);
        });
        it('should throw NotFoundException if customer not found', async () => {
            prisma.customer.findFirst = jest.fn().mockResolvedValue(null);
            await expect(service.generatePortalToken('nonexistent', 'workspace-uuid')).rejects.toThrow(common_1.NotFoundException);
        });
        it('should use custom expiry days', async () => {
            prisma.customer.findFirst = jest.fn().mockResolvedValue(mockCustomer);
            crypto.signCustomerPortalToken.mockReturnValue('mock-token');
            const result = await service.generatePortalToken('customer-uuid', 'workspace-uuid', 7);
            expect(result.token).toBe('mock-token');
            const expectedExpiry = new Date();
            expectedExpiry.setDate(expectedExpiry.getDate() + 7);
            const dayDiff = Math.abs(result.expiresAt.getTime() - expectedExpiry.getTime());
            expect(dayDiff).toBeLessThan(1000);
        });
    });
    describe('verifyToken', () => {
        it('should return payload for valid token', () => {
            const mockPayload = {
                customerId: 'customer-uuid',
                workspaceId: 'workspace-uuid',
                exp: Math.floor(Date.now() / 1000) + 3600,
            };
            crypto.verifyCustomerPortalToken.mockReturnValue(mockPayload);
            const result = service.verifyToken('valid-token');
            expect(result).toEqual(mockPayload);
        });
        it('should throw UnauthorizedException for invalid token', () => {
            crypto.verifyCustomerPortalToken.mockReturnValue(null);
            expect(() => service.verifyToken('invalid-token')).toThrow(common_1.UnauthorizedException);
        });
    });
    describe('getPortalData', () => {
        it('should return portal data for valid customer', async () => {
            prisma.customer.findFirst = jest.fn().mockResolvedValue(mockCustomer);
            prisma.invoice.findMany = jest.fn().mockResolvedValue([mockInvoice]);
            prisma.job.findMany = jest.fn().mockResolvedValue([mockJob]);
            const result = await service.getPortalData('customer-uuid', 'workspace-uuid');
            expect(result.customer).toEqual({
                id: mockCustomer.id,
                name: mockCustomer.name,
                email: mockCustomer.email,
                phone: mockCustomer.phone,
            });
            expect(result.invoices).toHaveLength(1);
            expect(result.invoices[0].invoiceNumber).toBe('INV-20240115-ABC123');
            expect(result.jobs).toHaveLength(1);
            expect(result.jobs[0].title).toBe('HVAC Repair');
        });
        it('should throw NotFoundException if customer not found', async () => {
            prisma.customer.findFirst = jest.fn().mockResolvedValue(null);
            await expect(service.getPortalData('nonexistent', 'workspace-uuid')).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('getInvoiceById', () => {
        it('should return invoice for valid ID', async () => {
            prisma.invoice.findFirst = jest.fn().mockResolvedValue(mockInvoice);
            const result = await service.getInvoiceById('invoice-uuid', 'customer-uuid', 'workspace-uuid');
            expect(result.id).toBe('invoice-uuid');
            expect(result.invoiceNumber).toBe('INV-20240115-ABC123');
            expect(result.total).toBe('110.00');
        });
        it('should throw NotFoundException if invoice not found', async () => {
            prisma.invoice.findFirst = jest.fn().mockResolvedValue(null);
            await expect(service.getInvoiceById('nonexistent', 'customer-uuid', 'workspace-uuid')).rejects.toThrow(common_1.NotFoundException);
        });
        it('should not return invoice belonging to different customer', async () => {
            prisma.invoice.findFirst = jest.fn().mockResolvedValue(null);
            await expect(service.getInvoiceById('invoice-uuid', 'other-customer', 'workspace-uuid')).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('getJobById', () => {
        it('should return job for valid ID', async () => {
            prisma.job.findFirst = jest.fn().mockResolvedValue(mockJob);
            const result = await service.getJobById('job-uuid', 'customer-uuid', 'workspace-uuid');
            expect(result.id).toBe('job-uuid');
            expect(result.title).toBe('HVAC Repair');
            expect(result.technician?.name).toBe('Jane Smith');
        });
        it('should throw NotFoundException if job not found', async () => {
            prisma.job.findFirst = jest.fn().mockResolvedValue(null);
            await expect(service.getJobById('nonexistent', 'customer-uuid', 'workspace-uuid')).rejects.toThrow(common_1.NotFoundException);
        });
        it('should handle job without technician', async () => {
            const jobWithoutTech = { ...mockJob, technician: null, technicianId: null };
            prisma.job.findFirst = jest.fn().mockResolvedValue(jobWithoutTech);
            const result = await service.getJobById('job-uuid', 'customer-uuid', 'workspace-uuid');
            expect(result.technician).toBeNull();
        });
    });
    describe('mapJobToSummary', () => {
        it('should handle technician with no user name', async () => {
            const jobWithEmptyTech = {
                ...mockJob,
                technician: {
                    id: 'tech-uuid',
                    user: {
                        firstName: null,
                        lastName: null,
                    },
                },
            };
            prisma.job.findFirst = jest.fn().mockResolvedValue(jobWithEmptyTech);
            const result = await service.getJobById('job-uuid', 'customer-uuid', 'workspace-uuid');
            expect(result.technician?.name).toBe('Technician');
        });
    });
    describe('getInvoicePaymentLink', () => {
        it('should call stripeService.createPaymentLinkForPortal with correct params', async () => {
            const mockPaymentLink = {
                paymentLinkUrl: 'https://checkout.stripe.com/xxx',
                paymentIntentId: 'pi_test123',
                clientSecret: '',
            };
            stripeService.createPaymentLinkForPortal = jest.fn().mockResolvedValue(mockPaymentLink);
            const result = await service.getInvoicePaymentLink('invoice-uuid', 'customer-uuid', 'workspace-uuid');
            expect(stripeService.createPaymentLinkForPortal).toHaveBeenCalledWith('invoice-uuid', 'customer-uuid', 'workspace-uuid');
            expect(result).toEqual(mockPaymentLink);
        });
    });
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const client_1 = require("@prisma/client");
const customer_service_1 = require("./customer.service");
const prisma_service_1 = require("../../core/database/prisma.service");
const workspaceContext = require("../../core/database/workspace-context");
describe('CustomerService', () => {
    let service;
    const mockWorkspaceId = 'workspace-123';
    const mockCustomerId = 'customer-123';
    const mockCustomer = {
        id: mockCustomerId,
        workspaceId: mockWorkspaceId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        address: { street: '123 Main St', city: 'San Francisco' },
        syncStatus: client_1.SyncStatus.PENDING,
        syncVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const mockPrismaService = {
        customer: {
            findFirst: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };
    beforeEach(async () => {
        jest.spyOn(workspaceContext, 'getWorkspaceId').mockReturnValue(mockWorkspaceId);
        const module = await testing_1.Test.createTestingModule({
            providers: [
                customer_service_1.CustomerService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(customer_service_1.CustomerService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('createCustomer', () => {
        it('should create a new customer', async () => {
            mockPrismaService.customer.create.mockResolvedValue(mockCustomer);
            const dto = {
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+1234567890',
            };
            const result = await service.createCustomer(dto);
            expect(result).toEqual(mockCustomer);
            expect(mockPrismaService.customer.create).toHaveBeenCalled();
        });
    });
    describe('findAllCustomers', () => {
        it('should return all customers ordered by name', async () => {
            mockPrismaService.customer.findMany.mockResolvedValue([mockCustomer]);
            const result = await service.findAllCustomers();
            expect(result).toEqual([mockCustomer]);
            expect(mockPrismaService.customer.findMany).toHaveBeenCalledWith(expect.objectContaining({
                orderBy: { name: 'asc' },
            }));
        });
    });
    describe('findCustomerById', () => {
        it('should return a customer when found', async () => {
            mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);
            const result = await service.findCustomerById(mockCustomerId);
            expect(result).toEqual(mockCustomer);
        });
        it('should throw NotFoundException when customer not found', async () => {
            mockPrismaService.customer.findFirst.mockResolvedValue(null);
            await expect(service.findCustomerById('non-existent')).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('updateCustomer', () => {
        it('should update a customer', async () => {
            mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);
            mockPrismaService.customer.update.mockResolvedValue({
                ...mockCustomer,
                name: 'Jane Doe',
            });
            const result = await service.updateCustomer(mockCustomerId, { name: 'Jane Doe' });
            expect(result.name).toBe('Jane Doe');
        });
    });
    describe('deleteCustomer', () => {
        it('should delete a customer', async () => {
            mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);
            mockPrismaService.customer.delete.mockResolvedValue(mockCustomer);
            const result = await service.deleteCustomer(mockCustomerId);
            expect(result).toEqual(mockCustomer);
        });
    });
    describe('searchCustomers', () => {
        it('should search customers by name, email, or phone', async () => {
            mockPrismaService.customer.findMany.mockResolvedValue([mockCustomer]);
            const result = await service.searchCustomers('john');
            expect(result).toEqual([mockCustomer]);
            expect(mockPrismaService.customer.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    workspaceId: mockWorkspaceId,
                    OR: expect.any(Array),
                }),
            }));
        });
    });
});

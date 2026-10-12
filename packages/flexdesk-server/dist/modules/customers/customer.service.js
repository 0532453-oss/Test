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
exports.CustomerService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const base_service_1 = require("../../engine/base.service");
let CustomerService = class CustomerService extends base_service_1.BaseService {
    constructor(prisma) {
        super(prisma, prisma.customer, 'Customer');
    }
    async createCustomer(dto) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const data = {
            workspace: { connect: { id: workspaceId } },
            name: dto.name,
            email: dto.email,
            phone: dto.phone,
            address: dto.address,
            syncStatus: client_1.SyncStatus.PENDING,
            syncVersion: 0,
        };
        const customer = await this.create({ data });
        return customer;
    }
    async findAllCustomers() {
        const customers = await this.findMany({
            orderBy: { name: 'asc' },
        });
        return customers;
    }
    async findCustomerById(id) {
        const customer = await this.findUniqueOrThrow({ where: { id } });
        return customer;
    }
    async updateCustomer(id, dto) {
        const existing = await this.findCustomerById(id);
        const data = {
            ...(dto.name && { name: dto.name }),
            ...(dto.email !== undefined && { email: dto.email }),
            ...(dto.phone !== undefined && { phone: dto.phone }),
            ...(dto.address !== undefined && {
                address: dto.address === null ? client_1.Prisma.JsonNull : dto.address,
            }),
            syncStatus: client_1.SyncStatus.PENDING,
            syncVersion: existing.syncVersion + 1,
        };
        const customer = await this.update({
            where: { id },
            data,
        });
        return customer;
    }
    async deleteCustomer(id) {
        await this.findCustomerById(id);
        const customer = await this.delete({ where: { id } });
        return customer;
    }
    async searchCustomers(query) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const customers = await this.prisma.customer.findMany({
            where: {
                workspaceId,
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                    { phone: { contains: query, mode: 'insensitive' } },
                ],
            },
            orderBy: { name: 'asc' },
            take: 20,
        });
        return customers;
    }
    async getCustomerWithJobs(id) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const customer = await this.prisma.customer.findFirst({
            where: { id, workspaceId },
            include: {
                jobs: {
                    orderBy: { scheduledAt: 'desc' },
                    take: 10,
                },
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
        return customer;
    }
};
exports.CustomerService = CustomerService;
exports.CustomerService = CustomerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function])
], CustomerService);

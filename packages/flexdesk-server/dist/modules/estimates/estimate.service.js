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
exports.EstimateService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const workspace_context_1 = require("../../core/database/workspace-context");
const DEFAULT_TAX_RATE = parseFloat(process.env.DEFAULT_TAX_RATE ?? '0.1');
const DEFAULT_ESTIMATE_VALIDITY_DAYS = parseInt(process.env.DEFAULT_ESTIMATE_VALIDITY_DAYS ?? '30', 10);
let EstimateService = class EstimateService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    getWorkspaceIdOrThrow() {
        const workspaceId = (0, workspace_context_1.getWorkspaceId)();
        if (!workspaceId) {
            throw new common_1.BadRequestException('Workspace context is required');
        }
        return workspaceId;
    }
    async findAll(status) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const where = { workspaceId };
        if (status) {
            where.status = status;
        }
        return this.prisma.estimate.findMany({
            where,
            include: {
                customer: true,
                lineItems: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findById(id) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const estimate = await this.prisma.estimate.findFirst({
            where: { id, workspaceId },
            include: {
                customer: true,
                lineItems: true,
                convertedJob: true,
            },
        });
        if (!estimate) {
            throw new common_1.NotFoundException('Estimate not found');
        }
        return estimate;
    }
    async findByCustomer(customerId) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        return this.prisma.estimate.findMany({
            where: { workspaceId, customerId },
            include: {
                lineItems: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(input) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const customer = await this.prisma.customer.findFirst({
            where: { id: input.customerId, workspaceId },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
        const taxRate = input.taxRate ?? DEFAULT_TAX_RATE;
        const discount = input.discount ?? 0;
        let subtotal = 0;
        const lineItemsData = input.lineItems.map((item) => {
            const total = item.quantity * item.unitPrice;
            subtotal += total;
            return {
                description: item.description,
                quantity: new client_1.Prisma.Decimal(item.quantity),
                unitPrice: new client_1.Prisma.Decimal(item.unitPrice),
                total: new client_1.Prisma.Decimal(total),
                serviceType: item.serviceType,
            };
        });
        const tax = subtotal * taxRate;
        const total = subtotal + tax - discount;
        const now = new Date();
        const validUntil = input.validUntil ??
            new Date(now.getTime() + DEFAULT_ESTIMATE_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
        const estimateNumber = this.generateEstimateNumber();
        return this.prisma.estimate.create({
            data: {
                workspaceId,
                customerId: input.customerId,
                estimateNumber,
                title: input.title,
                description: input.description,
                subtotal: new client_1.Prisma.Decimal(subtotal.toFixed(2)),
                tax: new client_1.Prisma.Decimal(tax.toFixed(2)),
                discount: new client_1.Prisma.Decimal(discount.toFixed(2)),
                total: new client_1.Prisma.Decimal(total.toFixed(2)),
                validUntil,
                estimatedDuration: input.estimatedDuration,
                location: input.location === null || input.location === undefined ? client_1.Prisma.JsonNull : input.location,
                priority: input.priority ?? client_1.JobPriority.MEDIUM,
                customerNotes: input.customerNotes,
                notes: input.notes,
                terms: input.terms,
                lineItems: {
                    create: lineItemsData,
                },
            },
            include: {
                customer: true,
                lineItems: true,
            },
        });
    }
    async update(id, input) {
        const estimate = await this.findById(id);
        if (estimate.status !== client_1.EstimateStatus.DRAFT) {
            throw new common_1.BadRequestException('Only draft estimates can be modified');
        }
        let updateData = {
            title: input.title,
            description: input.description,
            validUntil: input.validUntil,
            estimatedDuration: input.estimatedDuration,
            location: input.location === null || input.location === undefined ? undefined : input.location,
            priority: input.priority,
            customerNotes: input.customerNotes,
            notes: input.notes,
            terms: input.terms,
            syncStatus: client_1.SyncStatus.PENDING,
            syncVersion: estimate.syncVersion + 1,
        };
        if (input.lineItems) {
            const taxRate = input.taxRate ?? DEFAULT_TAX_RATE;
            const discount = input.discount ?? 0;
            let subtotal = 0;
            const lineItemsData = input.lineItems.map((item) => {
                const total = item.quantity * item.unitPrice;
                subtotal += total;
                return {
                    description: item.description,
                    quantity: new client_1.Prisma.Decimal(item.quantity),
                    unitPrice: new client_1.Prisma.Decimal(item.unitPrice),
                    total: new client_1.Prisma.Decimal(total),
                    serviceType: item.serviceType,
                };
            });
            const tax = subtotal * taxRate;
            const total = subtotal + tax - discount;
            updateData = {
                ...updateData,
                subtotal: new client_1.Prisma.Decimal(subtotal.toFixed(2)),
                tax: new client_1.Prisma.Decimal(tax.toFixed(2)),
                discount: new client_1.Prisma.Decimal(discount.toFixed(2)),
                total: new client_1.Prisma.Decimal(total.toFixed(2)),
                lineItems: {
                    deleteMany: {},
                    create: lineItemsData,
                },
            };
        }
        return this.prisma.estimate.update({
            where: { id },
            data: updateData,
            include: {
                customer: true,
                lineItems: true,
            },
        });
    }
    async send(id) {
        const estimate = await this.findById(id);
        if (estimate.status !== client_1.EstimateStatus.DRAFT) {
            throw new common_1.BadRequestException('Only draft estimates can be sent');
        }
        return this.prisma.estimate.update({
            where: { id },
            data: {
                status: client_1.EstimateStatus.SENT,
                sentAt: new Date(),
                syncStatus: client_1.SyncStatus.PENDING,
                syncVersion: estimate.syncVersion + 1,
            },
            include: {
                customer: true,
                lineItems: true,
            },
        });
    }
    async markViewed(id) {
        const estimate = await this.findById(id);
        if (estimate.status !== client_1.EstimateStatus.SENT) {
            throw new common_1.BadRequestException('Only sent estimates can be marked as viewed');
        }
        return this.prisma.estimate.update({
            where: { id },
            data: {
                status: client_1.EstimateStatus.VIEWED,
                viewedAt: new Date(),
                syncStatus: client_1.SyncStatus.PENDING,
                syncVersion: estimate.syncVersion + 1,
            },
            include: {
                customer: true,
                lineItems: true,
            },
        });
    }
    async accept(id) {
        const estimate = await this.findById(id);
        if (estimate.status !== client_1.EstimateStatus.SENT &&
            estimate.status !== client_1.EstimateStatus.VIEWED) {
            throw new common_1.BadRequestException('Only sent or viewed estimates can be accepted');
        }
        return this.prisma.estimate.update({
            where: { id },
            data: {
                status: client_1.EstimateStatus.ACCEPTED,
                respondedAt: new Date(),
                syncStatus: client_1.SyncStatus.PENDING,
                syncVersion: estimate.syncVersion + 1,
            },
            include: {
                customer: true,
                lineItems: true,
            },
        });
    }
    async reject(id) {
        const estimate = await this.findById(id);
        if (estimate.status !== client_1.EstimateStatus.SENT &&
            estimate.status !== client_1.EstimateStatus.VIEWED) {
            throw new common_1.BadRequestException('Only sent or viewed estimates can be rejected');
        }
        return this.prisma.estimate.update({
            where: { id },
            data: {
                status: client_1.EstimateStatus.REJECTED,
                respondedAt: new Date(),
                syncStatus: client_1.SyncStatus.PENDING,
                syncVersion: estimate.syncVersion + 1,
            },
            include: {
                customer: true,
                lineItems: true,
            },
        });
    }
    async convertToJob(id, input = {}) {
        const estimate = await this.findById(id);
        if (estimate.status !== client_1.EstimateStatus.ACCEPTED) {
            throw new common_1.BadRequestException('Only accepted estimates can be converted to jobs');
        }
        if (estimate.convertedJobId) {
            throw new common_1.BadRequestException('This estimate has already been converted to a job');
        }
        const job = await this.prisma.job.create({
            data: {
                workspaceId: estimate.workspaceId,
                customerId: estimate.customerId,
                technicianId: input.technicianId,
                title: estimate.title,
                description: estimate.description,
                status: client_1.JobStatus.SCHEDULED,
                priority: estimate.priority,
                scheduledAt: input.scheduledAt,
                estimatedDuration: estimate.estimatedDuration,
                location: estimate.location === null ? client_1.Prisma.JsonNull : estimate.location,
            },
        });
        return this.prisma.estimate.update({
            where: { id },
            data: {
                status: client_1.EstimateStatus.CONVERTED,
                convertedJobId: job.id,
                syncStatus: client_1.SyncStatus.PENDING,
                syncVersion: estimate.syncVersion + 1,
            },
            include: {
                customer: true,
                lineItems: true,
                convertedJob: true,
            },
        });
    }
    async delete(id) {
        const estimate = await this.findById(id);
        if (estimate.status !== client_1.EstimateStatus.DRAFT) {
            throw new common_1.BadRequestException('Only draft estimates can be deleted');
        }
        await this.prisma.estimate.delete({
            where: { id },
        });
    }
    async checkExpiredEstimates() {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const now = new Date();
        const result = await this.prisma.estimate.updateMany({
            where: {
                workspaceId,
                status: {
                    in: [client_1.EstimateStatus.SENT, client_1.EstimateStatus.VIEWED],
                },
                validUntil: {
                    lt: now,
                },
            },
            data: {
                status: client_1.EstimateStatus.EXPIRED,
                syncStatus: client_1.SyncStatus.PENDING,
            },
        });
        return result.count;
    }
    generateEstimateNumber() {
        const now = new Date();
        const datePart = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0'),
        ].join('');
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `EST-${datePart}-${randomPart}`;
    }
};
exports.EstimateService = EstimateService;
exports.EstimateService = EstimateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function])
], EstimateService);

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
exports.PartService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const base_service_1 = require("../../engine/base.service");
let PartService = class PartService extends base_service_1.BaseService {
    constructor(prismaService) {
        super(prismaService, prismaService.part, 'Part');
        this.prismaService = prismaService;
    }
    async createPart(dto) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        if (dto.sku) {
            const existingSku = await this.prisma.part.findFirst({
                where: { workspaceId, sku: dto.sku },
            });
            if (existingSku) {
                throw new common_1.ConflictException(`Part with SKU "${dto.sku}" already exists`);
            }
        }
        return this.prisma.part.create({
            data: {
                workspaceId,
                sku: dto.sku,
                name: dto.name,
                description: dto.description,
                category: dto.category,
                unitCost: new client_1.Prisma.Decimal(dto.unitCost),
                unitPrice: new client_1.Prisma.Decimal(dto.unitPrice),
                quantityOnHand: dto.quantityOnHand ?? 0,
                reorderPoint: dto.reorderPoint ?? 5,
                reorderQuantity: dto.reorderQuantity ?? 10,
                isActive: dto.isActive ?? true,
            },
        });
    }
    async updatePart(partId, dto) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const part = await this.prisma.part.findFirst({
            where: { id: partId, workspaceId },
        });
        if (!part) {
            throw new common_1.NotFoundException('Part not found');
        }
        if (dto.sku && dto.sku !== part.sku) {
            const existingSku = await this.prisma.part.findFirst({
                where: { workspaceId, sku: dto.sku, id: { not: partId } },
            });
            if (existingSku) {
                throw new common_1.ConflictException(`Part with SKU "${dto.sku}" already exists`);
            }
        }
        return this.prisma.part.update({
            where: { id: partId },
            data: {
                ...(dto.sku !== undefined && { sku: dto.sku }),
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.category !== undefined && { category: dto.category }),
                ...(dto.unitCost !== undefined && { unitCost: new client_1.Prisma.Decimal(dto.unitCost) }),
                ...(dto.unitPrice !== undefined && { unitPrice: new client_1.Prisma.Decimal(dto.unitPrice) }),
                ...(dto.quantityOnHand !== undefined && { quantityOnHand: dto.quantityOnHand }),
                ...(dto.reorderPoint !== undefined && { reorderPoint: dto.reorderPoint }),
                ...(dto.reorderQuantity !== undefined && { reorderQuantity: dto.reorderQuantity }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                syncVersion: part.syncVersion + 1,
            },
        });
    }
    async getPartById(partId) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const part = await this.prisma.part.findFirst({
            where: { id: partId, workspaceId },
        });
        if (!part) {
            throw new common_1.NotFoundException('Part not found');
        }
        return part;
    }
    async listParts(filters) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const where = { workspaceId };
        if (filters?.category) {
            where.category = filters.category;
        }
        if (filters?.isActive !== undefined) {
            where.isActive = filters.isActive;
        }
        if (filters?.lowStock) {
            where.quantityOnHand = { lte: this.prisma.part.fields.reorderPoint };
        }
        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { sku: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        return this.prisma.part.findMany({
            where,
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        });
    }
    async getLowStockParts() {
        const workspaceId = this.getWorkspaceIdOrThrow();
        return this.prisma.$queryRaw `
      SELECT * FROM parts
      WHERE "workspaceId" = ${workspaceId}::uuid
      AND "quantityOnHand" <= "reorderPoint"
      AND "isActive" = true
      ORDER BY ("reorderPoint" - "quantityOnHand") DESC
    `;
    }
    async adjustInventory(partId, adjustment, reason) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const part = await this.prisma.part.findFirst({
            where: { id: partId, workspaceId },
        });
        if (!part) {
            throw new common_1.NotFoundException('Part not found');
        }
        const newQuantity = part.quantityOnHand + adjustment;
        if (newQuantity < 0) {
            throw new common_1.BadRequestException('Adjustment would result in negative inventory');
        }
        return this.prisma.part.update({
            where: { id: partId },
            data: {
                quantityOnHand: newQuantity,
                syncVersion: part.syncVersion + 1,
            },
        });
    }
    async deletePart(partId) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const part = await this.prisma.part.findFirst({
            where: { id: partId, workspaceId },
        });
        if (!part) {
            throw new common_1.NotFoundException('Part not found');
        }
        const usageCount = await this.prisma.jobPart.count({
            where: { partId },
        });
        if (usageCount > 0) {
            return this.prisma.part.update({
                where: { id: partId },
                data: {
                    isActive: false,
                    syncVersion: part.syncVersion + 1,
                },
            });
        }
        return this.prisma.part.delete({
            where: { id: partId },
        });
    }
    async getCategories() {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const categories = await this.prisma.part.groupBy({
            by: ['category'],
            where: { workspaceId, category: { not: null } },
            orderBy: { category: 'asc' },
        });
        return categories.map((c) => c.category).filter(Boolean);
    }
    async addPartToJob(jobId, dto) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const job = await this.prisma.job.findFirst({
            where: { id: jobId, workspaceId },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        const part = await this.prisma.part.findFirst({
            where: { id: dto.partId, workspaceId },
        });
        if (!part) {
            throw new common_1.NotFoundException('Part not found');
        }
        if (!part.isActive) {
            throw new common_1.BadRequestException('Cannot add inactive part to job');
        }
        const existingJobPart = await this.prisma.jobPart.findFirst({
            where: { jobId, partId: dto.partId },
        });
        if (existingJobPart) {
            throw new common_1.ConflictException('Part is already added to this job. Use update to change quantity.');
        }
        if (dto.quantity > part.quantityOnHand) {
            throw new common_1.BadRequestException(`Insufficient inventory. Available: ${part.quantityOnHand}, Requested: ${dto.quantity}`);
        }
        const unitPrice = dto.unitPrice !== undefined
            ? new client_1.Prisma.Decimal(dto.unitPrice)
            : part.unitPrice;
        const total = unitPrice.mul(new client_1.Prisma.Decimal(dto.quantity));
        const [jobPart] = await this.prisma.$transaction([
            this.prisma.jobPart.create({
                data: {
                    jobId,
                    partId: dto.partId,
                    quantity: new client_1.Prisma.Decimal(dto.quantity),
                    unitPrice,
                    total,
                    notes: dto.notes,
                },
                include: {
                    part: true,
                },
            }),
            this.prisma.part.update({
                where: { id: dto.partId },
                data: {
                    quantityOnHand: part.quantityOnHand - Math.ceil(dto.quantity),
                    syncVersion: part.syncVersion + 1,
                },
            }),
        ]);
        return jobPart;
    }
    async updateJobPart(jobPartId, dto) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const jobPart = await this.prisma.jobPart.findFirst({
            where: { id: jobPartId },
            include: {
                job: true,
                part: true,
            },
        });
        if (!jobPart || jobPart.job.workspaceId !== workspaceId) {
            throw new common_1.NotFoundException('Job part not found');
        }
        let inventoryAdjustment = 0;
        if (dto.quantity !== undefined) {
            const oldQuantity = Number(jobPart.quantity);
            inventoryAdjustment = oldQuantity - dto.quantity;
            if (inventoryAdjustment < 0) {
                const additionalNeeded = Math.abs(inventoryAdjustment);
                if (additionalNeeded > jobPart.part.quantityOnHand) {
                    throw new common_1.BadRequestException(`Insufficient inventory. Available: ${jobPart.part.quantityOnHand}, Additional needed: ${additionalNeeded}`);
                }
            }
        }
        const newQuantity = dto.quantity !== undefined
            ? new client_1.Prisma.Decimal(dto.quantity)
            : jobPart.quantity;
        const newUnitPrice = dto.unitPrice !== undefined
            ? new client_1.Prisma.Decimal(dto.unitPrice)
            : jobPart.unitPrice;
        const newTotal = newUnitPrice.mul(newQuantity);
        const updates = [
            this.prisma.jobPart.update({
                where: { id: jobPartId },
                data: {
                    ...(dto.quantity !== undefined && { quantity: newQuantity }),
                    ...(dto.unitPrice !== undefined && { unitPrice: newUnitPrice }),
                    total: newTotal,
                    ...(dto.notes !== undefined && { notes: dto.notes }),
                    syncVersion: jobPart.syncVersion + 1,
                },
                include: {
                    part: true,
                },
            }),
        ];
        if (inventoryAdjustment !== 0) {
            updates.push(this.prisma.part.update({
                where: { id: jobPart.partId },
                data: {
                    quantityOnHand: jobPart.part.quantityOnHand + Math.ceil(inventoryAdjustment),
                    syncVersion: jobPart.part.syncVersion + 1,
                },
            }));
        }
        const [updatedJobPart] = await this.prisma.$transaction(updates);
        return updatedJobPart;
    }
    async removePartFromJob(jobPartId) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const jobPart = await this.prisma.jobPart.findFirst({
            where: { id: jobPartId },
            include: {
                job: true,
                part: true,
            },
        });
        if (!jobPart || jobPart.job.workspaceId !== workspaceId) {
            throw new common_1.NotFoundException('Job part not found');
        }
        await this.prisma.$transaction([
            this.prisma.part.update({
                where: { id: jobPart.partId },
                data: {
                    quantityOnHand: jobPart.part.quantityOnHand + Math.ceil(Number(jobPart.quantity)),
                    syncVersion: jobPart.part.syncVersion + 1,
                },
            }),
            this.prisma.jobPart.delete({
                where: { id: jobPartId },
            }),
        ]);
        return { deleted: true };
    }
    async getJobParts(jobId) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const job = await this.prisma.job.findFirst({
            where: { id: jobId, workspaceId },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        return this.prisma.jobPart.findMany({
            where: { jobId },
            include: {
                part: true,
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async getJobPartsTotals(jobId) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const job = await this.prisma.job.findFirst({
            where: { id: jobId, workspaceId },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        const jobParts = await this.prisma.jobPart.findMany({
            where: { jobId },
            include: { part: true },
        });
        let totalCost = new client_1.Prisma.Decimal(0);
        let totalPrice = new client_1.Prisma.Decimal(0);
        for (const jp of jobParts) {
            totalCost = totalCost.add(jp.part.unitCost.mul(jp.quantity));
            totalPrice = totalPrice.add(jp.total);
        }
        return {
            jobId,
            partsCount: jobParts.length,
            totalCost: Number(totalCost),
            totalPrice: Number(totalPrice),
            profit: Number(totalPrice.sub(totalCost)),
        };
    }
};
exports.PartService = PartService;
exports.PartService = PartService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function])
], PartService);

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
exports.PropertyService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const base_service_1 = require("../../engine/base.service");
let PropertyService = class PropertyService extends base_service_1.BaseService {
    constructor(prisma) {
        super(prisma, prisma.property, 'Property');
    }
    async createProperty(dto) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const customer = await this.prisma.customer.findFirst({
            where: { id: dto.customerId, workspaceId },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
        if (dto.isPrimary) {
            await this.prisma.property.updateMany({
                where: { customerId: dto.customerId, workspaceId, isPrimary: true },
                data: { isPrimary: false },
            });
        }
        const data = {
            workspace: { connect: { id: workspaceId } },
            customer: { connect: { id: dto.customerId } },
            name: dto.name,
            isPrimary: dto.isPrimary ?? false,
            street: dto.street,
            street2: dto.street2,
            city: dto.city,
            state: dto.state,
            zip: dto.zip,
            country: dto.country ?? 'US',
            lat: dto.lat,
            lng: dto.lng,
            accessNotes: dto.accessNotes,
            serviceNotes: dto.serviceNotes,
            syncStatus: client_1.SyncStatus.PENDING,
            syncVersion: 0,
        };
        const property = await this.create({ data });
        return property;
    }
    async findAllProperties() {
        const properties = await this.findMany({
            orderBy: [{ customerId: 'asc' }, { isPrimary: 'desc' }, { name: 'asc' }],
            include: { customer: { select: { id: true, name: true } } },
        });
        return properties;
    }
    async findPropertiesByCustomer(customerId) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const properties = await this.prisma.property.findMany({
            where: { customerId, workspaceId },
            orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
        });
        return properties;
    }
    async findPropertyById(id) {
        const property = await this.findUniqueOrThrow({
            where: { id },
            include: { customer: { select: { id: true, name: true } } },
        });
        return property;
    }
    async getPrimaryProperty(customerId) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const property = await this.prisma.property.findFirst({
            where: { customerId, workspaceId, isPrimary: true },
        });
        return property;
    }
    async updateProperty(id, dto) {
        const existing = await this.findPropertyById(id);
        const workspaceId = this.getWorkspaceIdOrThrow();
        if (dto.isPrimary === true) {
            await this.prisma.property.updateMany({
                where: {
                    customerId: existing.customerId,
                    workspaceId,
                    isPrimary: true,
                    id: { not: id },
                },
                data: { isPrimary: false },
            });
        }
        const data = {
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.isPrimary !== undefined && { isPrimary: dto.isPrimary }),
            ...(dto.street !== undefined && { street: dto.street }),
            ...(dto.street2 !== undefined && { street2: dto.street2 }),
            ...(dto.city !== undefined && { city: dto.city }),
            ...(dto.state !== undefined && { state: dto.state }),
            ...(dto.zip !== undefined && { zip: dto.zip }),
            ...(dto.country !== undefined && { country: dto.country }),
            ...(dto.lat !== undefined && { lat: dto.lat }),
            ...(dto.lng !== undefined && { lng: dto.lng }),
            ...(dto.accessNotes !== undefined && { accessNotes: dto.accessNotes }),
            ...(dto.serviceNotes !== undefined && { serviceNotes: dto.serviceNotes }),
            syncStatus: client_1.SyncStatus.PENDING,
            syncVersion: existing.syncVersion + 1,
        };
        const property = await this.update({
            where: { id },
            data,
        });
        return property;
    }
    async setPrimaryProperty(id) {
        const property = await this.findPropertyById(id);
        const workspaceId = this.getWorkspaceIdOrThrow();
        await this.prisma.property.updateMany({
            where: {
                customerId: property.customerId,
                workspaceId,
                isPrimary: true,
            },
            data: { isPrimary: false },
        });
        const updated = await this.update({
            where: { id },
            data: {
                isPrimary: true,
                syncStatus: client_1.SyncStatus.PENDING,
                syncVersion: property.syncVersion + 1,
            },
        });
        return updated;
    }
    async deleteProperty(id) {
        const property = await this.findPropertyById(id);
        const jobCount = await this.prisma.job.count({
            where: { propertyId: id },
        });
        if (jobCount > 0) {
            throw new common_1.BadRequestException(`Cannot delete property: it is referenced by ${jobCount} job(s)`);
        }
        const templateCount = await this.prisma.recurringJobTemplate.count({
            where: { propertyId: id },
        });
        if (templateCount > 0) {
            throw new common_1.BadRequestException(`Cannot delete property: it is referenced by ${templateCount} recurring template(s)`);
        }
        const deleted = await this.delete({ where: { id } });
        return deleted;
    }
    async searchProperties(query) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const properties = await this.prisma.property.findMany({
            where: {
                workspaceId,
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { street: { contains: query, mode: 'insensitive' } },
                    { city: { contains: query, mode: 'insensitive' } },
                    { zip: { contains: query, mode: 'insensitive' } },
                ],
            },
            include: { customer: { select: { id: true, name: true } } },
            orderBy: { name: 'asc' },
            take: 20,
        });
        return properties;
    }
    async getPropertyWithRelations(id) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const property = await this.prisma.property.findFirst({
            where: { id, workspaceId },
            include: {
                customer: true,
                jobs: {
                    orderBy: { scheduledAt: 'desc' },
                    take: 10,
                },
            },
        });
        if (!property) {
            throw new common_1.NotFoundException('Property not found');
        }
        return property;
    }
    async migrateCustomerAddressToProperty(customerId, propertyName = 'Primary') {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const customer = await this.prisma.customer.findFirst({
            where: { id: customerId, workspaceId },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
        if (!customer.address) {
            return null;
        }
        const legacyAddress = customer.address;
        const existingProperty = await this.prisma.property.findFirst({
            where: { customerId, workspaceId },
        });
        if (existingProperty) {
            return null;
        }
        const property = await this.createProperty({
            customerId,
            name: propertyName,
            isPrimary: true,
            street: legacyAddress.street,
            city: legacyAddress.city,
            state: legacyAddress.state,
            zip: legacyAddress.zip,
            lat: legacyAddress.lat,
            lng: legacyAddress.lng,
        });
        return property;
    }
};
exports.PropertyService = PropertyService;
exports.PropertyService = PropertyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function])
], PropertyService);

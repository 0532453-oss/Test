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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
let EstimateController = class EstimateController {
    constructor(estimateService) {
        this.estimateService = estimateService;
    }
    async create(dto) {
        return this.estimateService.create({
            customerId: dto.customerId,
            title: dto.title,
            description: dto.description,
            lineItems: dto.lineItems,
            discount: dto.discount,
            taxRate: dto.taxRate,
            validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
            estimatedDuration: dto.estimatedDuration,
            location: dto.location,
            priority: dto.priority,
            customerNotes: dto.customerNotes,
            notes: dto.notes,
            terms: dto.terms,
        });
    }
    async findAll(status) {
        return this.estimateService.findAll(status);
    }
    async findOne(id) {
        return this.estimateService.findById(id);
    }
    async findByCustomer(customerId) {
        return this.estimateService.findByCustomer(customerId);
    }
    async update(id, dto) {
        return this.estimateService.update(id, {
            title: dto.title,
            description: dto.description,
            lineItems: dto.lineItems,
            discount: dto.discount,
            taxRate: dto.taxRate,
            validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
            estimatedDuration: dto.estimatedDuration,
            location: dto.location,
            priority: dto.priority,
            customerNotes: dto.customerNotes,
            notes: dto.notes,
            terms: dto.terms,
        });
    }
    async send(id) {
        return this.estimateService.send(id);
    }
    async markViewed(id) {
        return this.estimateService.markViewed(id);
    }
    async accept(id) {
        return this.estimateService.accept(id);
    }
    async reject(id) {
        return this.estimateService.reject(id);
    }
    async convertToJob(id, dto) {
        return this.estimateService.convertToJob(id, {
            technicianId: dto.technicianId,
            scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        });
    }
    async delete(id) {
        return this.estimateService.delete(id);
    }
    async checkExpired() {
        const count = await this.estimateService.checkExpiredEstimates();
        return { expiredCount: count };
    }
};
exports.EstimateController = EstimateController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new estimate/quote' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Estimate created' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Customer not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], EstimateController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all estimates' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: client_1.EstimateStatus }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of estimates' }),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EstimateController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get estimate by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Estimate UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estimate found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Estimate not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EstimateController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('by-customer/:customerId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get estimates by customer' }),
    (0, swagger_1.ApiParam)({ name: 'customerId', description: 'Customer UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Customer estimates' }),
    __param(0, (0, common_1.Param)('customerId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EstimateController.prototype, "findByCustomer", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update estimate (draft only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Estimate UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estimate updated' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Cannot modify non-draft estimate' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Estimate not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], EstimateController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/send'),
    (0, swagger_1.ApiOperation)({ summary: 'Send estimate to customer' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Estimate UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estimate sent' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Only draft estimates can be sent' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EstimateController.prototype, "send", null);
__decorate([
    (0, common_1.Post)(':id/mark-viewed'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark estimate as viewed by customer' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Estimate UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estimate marked as viewed' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Only sent estimates can be marked as viewed' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EstimateController.prototype, "markViewed", null);
__decorate([
    (0, common_1.Post)(':id/accept'),
    (0, swagger_1.ApiOperation)({ summary: 'Accept estimate (customer action)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Estimate UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estimate accepted' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Only sent/viewed estimates can be accepted' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EstimateController.prototype, "accept", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject estimate (customer action)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Estimate UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estimate rejected' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Only sent/viewed estimates can be rejected' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EstimateController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':id/convert-to-job'),
    (0, swagger_1.ApiOperation)({ summary: 'Convert accepted estimate to a job' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Estimate UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Estimate converted to job' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Only accepted estimates can be converted' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], EstimateController.prototype, "convertToJob", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete estimate (draft only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Estimate UUID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Estimate deleted' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Only draft estimates can be deleted' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Estimate not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EstimateController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('check-expired'),
    (0, swagger_1.ApiOperation)({ summary: 'Check and mark expired estimates' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Number of estimates marked as expired' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EstimateController.prototype, "checkExpired", null);
exports.EstimateController = EstimateController = __decorate([
    (0, swagger_1.ApiTags)('estimates'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('estimates'),
    __metadata("design:paramtypes", [Function])
], EstimateController);

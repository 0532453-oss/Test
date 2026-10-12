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
exports.JobPartController = exports.PartController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let PartController = class PartController {
    constructor(partService) {
        this.partService = partService;
    }
    async createPart(dto) {
        return this.partService.createPart(dto);
    }
    async listParts(category, isActive, lowStock, search) {
        return this.partService.listParts({
            category,
            isActive: isActive ? isActive === 'true' : undefined,
            lowStock: lowStock === 'true',
            search,
        });
    }
    async getLowStockParts() {
        return this.partService.getLowStockParts();
    }
    async getCategories() {
        return this.partService.getCategories();
    }
    async getPart(id) {
        return this.partService.getPartById(id);
    }
    async updatePart(id, dto) {
        return this.partService.updatePart(id, dto);
    }
    async adjustInventory(id, dto) {
        return this.partService.adjustInventory(id, dto.adjustment, dto.reason);
    }
    async deletePart(id) {
        return this.partService.deletePart(id);
    }
};
exports.PartController = PartController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new part' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Part created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'SKU already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], PartController.prototype, "createPart", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all parts' }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false, description: 'Filter by category' }),
    (0, swagger_1.ApiQuery)({ name: 'isActive', required: false, description: 'Filter by active status' }),
    (0, swagger_1.ApiQuery)({ name: 'lowStock', required: false, description: 'Only show low stock parts' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, description: 'Search by name, SKU, or description' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of parts' }),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('isActive')),
    __param(2, (0, common_1.Query)('lowStock')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], PartController.prototype, "listParts", null);
__decorate([
    (0, common_1.Get)('low-stock'),
    (0, swagger_1.ApiOperation)({ summary: 'Get parts with low stock (below reorder point)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of low stock parts' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PartController.prototype, "getLowStockParts", null);
__decorate([
    (0, common_1.Get)('categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all part categories in workspace' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of categories' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PartController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a part by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Part ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Part details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Part not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PartController.prototype, "getPart", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a part' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Part ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Part updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Part not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'SKU already exists' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], PartController.prototype, "updatePart", null);
__decorate([
    (0, common_1.Patch)(':id/inventory'),
    (0, swagger_1.ApiOperation)({ summary: 'Adjust part inventory quantity' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Part ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Inventory adjusted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Adjustment would result in negative inventory' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Part not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], PartController.prototype, "adjustInventory", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a part (soft delete if used in jobs)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Part ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Part deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Part not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PartController.prototype, "deletePart", null);
exports.PartController = PartController = __decorate([
    (0, swagger_1.ApiTags)('Parts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('parts'),
    __metadata("design:paramtypes", [Function])
], PartController);
let JobPartController = class JobPartController {
    constructor(partService) {
        this.partService = partService;
    }
    async getJobParts(jobId) {
        return this.partService.getJobParts(jobId);
    }
    async getJobPartsTotals(jobId) {
        return this.partService.getJobPartsTotals(jobId);
    }
    async addPartToJob(jobId, dto) {
        return this.partService.addPartToJob(jobId, dto);
    }
    async updateJobPart(jobPartId, dto) {
        return this.partService.updateJobPart(jobPartId, dto);
    }
    async removePartFromJob(jobPartId) {
        return this.partService.removePartFromJob(jobPartId);
    }
};
exports.JobPartController = JobPartController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all parts for a job' }),
    (0, swagger_1.ApiParam)({ name: 'jobId', description: 'Job ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of job parts' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Job not found' }),
    __param(0, (0, common_1.Param)('jobId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JobPartController.prototype, "getJobParts", null);
__decorate([
    (0, common_1.Get)('totals'),
    (0, swagger_1.ApiOperation)({ summary: 'Get total cost and price for job parts' }),
    (0, swagger_1.ApiParam)({ name: 'jobId', description: 'Job ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Job parts totals',
        schema: {
            type: 'object',
            properties: {
                jobId: { type: 'string' },
                partsCount: { type: 'number' },
                totalCost: { type: 'number' },
                totalPrice: { type: 'number' },
                profit: { type: 'number' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Job not found' }),
    __param(0, (0, common_1.Param)('jobId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JobPartController.prototype, "getJobPartsTotals", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Add a part to a job' }),
    (0, swagger_1.ApiParam)({ name: 'jobId', description: 'Job ID' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Part added to job' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Insufficient inventory or inactive part' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Job or part not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Part already added to job' }),
    __param(0, (0, common_1.Param)('jobId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], JobPartController.prototype, "addPartToJob", null);
__decorate([
    (0, common_1.Patch)(':jobPartId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a job part' }),
    (0, swagger_1.ApiParam)({ name: 'jobId', description: 'Job ID' }),
    (0, swagger_1.ApiParam)({ name: 'jobPartId', description: 'Job Part ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Job part updated' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Insufficient inventory for quantity increase' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Job part not found' }),
    __param(0, (0, common_1.Param)('jobPartId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], JobPartController.prototype, "updateJobPart", null);
__decorate([
    (0, common_1.Delete)(':jobPartId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a part from a job (returns inventory)' }),
    (0, swagger_1.ApiParam)({ name: 'jobId', description: 'Job ID' }),
    (0, swagger_1.ApiParam)({ name: 'jobPartId', description: 'Job Part ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Part removed from job' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Job part not found' }),
    __param(0, (0, common_1.Param)('jobPartId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JobPartController.prototype, "removePartFromJob", null);
exports.JobPartController = JobPartController = __decorate([
    (0, swagger_1.ApiTags)('Job Parts'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('jobs/:jobId/parts'),
    __metadata("design:paramtypes", [Function])
], JobPartController);

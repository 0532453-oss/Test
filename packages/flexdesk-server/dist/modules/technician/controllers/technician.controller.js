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
exports.TechnicianController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../auth/decorators/current-user.decorator");
const next_job_response_dto_1 = require("../dto/next-job-response.dto");
let TechnicianController = class TechnicianController {
    constructor(technicianService) {
        this.technicianService = technicianService;
    }
    async create(dto) {
        return this.technicianService.createTechnician(dto);
    }
    async findAll(available) {
        if (available !== undefined) {
            return this.technicianService.findAvailableTechnicians(available);
        }
        return this.technicianService.findAllTechnicians();
    }
    async getMyProfile(user) {
        return this.technicianService.findTechnicianByUserId(user.id);
    }
    async findOne(id) {
        return this.technicianService.findTechnicianById(id);
    }
    async update(id, dto) {
        return this.technicianService.updateTechnician(id, dto);
    }
    async updateLocation(dto, user) {
        await this.technicianService.updateCurrentLocation(user.id, dto);
    }
    async toggleAvailability(id, dto) {
        return this.technicianService.setAvailability(id, dto.isAvailable);
    }
    async getNextJob(id) {
        return this.technicianService.getNextJob(id);
    }
};
exports.TechnicianController = TechnicianController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new technician' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Technician created' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], TechnicianController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all technicians' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of technicians' }),
    (0, swagger_1.ApiQuery)({ name: 'available', required: false, type: Boolean }),
    __param(0, (0, common_1.Query)('available')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", Promise)
], TechnicianController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current technician profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Current technician profile' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Technician not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TechnicianController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a technician by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Technician UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Technician found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Technician not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TechnicianController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a technician' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Technician UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Technician updated' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], TechnicianController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)('location'),
    (0, swagger_1.ApiOperation)({ summary: 'Update current technician location' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Location updated' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function, Object]),
    __metadata("design:returntype", Promise)
], TechnicianController.prototype, "updateLocation", null);
__decorate([
    (0, common_1.Patch)(':id/availability'),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle technician availability' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Technician UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Availability updated' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], TechnicianController.prototype, "toggleAvailability", null);
__decorate([
    (0, common_1.Get)(':id/next-job'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get next scheduled job for a technician',
        description: 'Returns the next upcoming job with travel time estimation from Google Distance Matrix API',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Technician UUID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Next job details or no upcoming job message',
        type: next_job_response_dto_1.NextJobResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Technician not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TechnicianController.prototype, "getNextJob", null);
exports.TechnicianController = TechnicianController = __decorate([
    (0, swagger_1.ApiTags)('technicians'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('technicians'),
    __metadata("design:paramtypes", [Function])
], TechnicianController);

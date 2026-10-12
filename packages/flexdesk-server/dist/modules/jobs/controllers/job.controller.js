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
exports.JobController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../../auth/decorators/current-user.decorator");
let JobController = class JobController {
    constructor(jobService) {
        this.jobService = jobService;
    }
    async create(dto) {
        return this.jobService.createJob(dto);
    }
    async findAll(status, customerId, technicianId) {
        return this.jobService.findAllJobs({ status, customerId, technicianId });
    }
    async syncJobs(date, user) {
        let targetDate;
        if (!date) {
            targetDate = new Date();
        }
        else {
            const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateFormatRegex.test(date)) {
                throw new common_1.BadRequestException('Invalid date format. Expected YYYY-MM-DD format (e.g., 2024-01-15).');
            }
            const parts = date.split('-');
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const parsed = new Date(year, month, day);
            if (parsed.getFullYear() !== year ||
                parsed.getMonth() !== month ||
                parsed.getDate() !== day) {
                throw new common_1.BadRequestException('Invalid date. Please provide a valid date in YYYY-MM-DD format.');
            }
            targetDate = parsed;
        }
        return this.jobService.findTechnicianJobsForDate(user.id, targetDate);
    }
    async getScheduledJobs(dateRange) {
        return this.jobService.findJobsByDateRange(new Date(dateRange.startDate), new Date(dateRange.endDate));
    }
    async findOne(id) {
        return this.jobService.getJobById(id);
    }
    async getJobDetails(id) {
        return this.jobService.getJobWithDetails(id);
    }
    async update(id, dto) {
        return this.jobService.updateJob(id, dto);
    }
    async updateStatus(id, body) {
        return this.jobService.transitionStatus(id, body.status);
    }
    async assignTechnician(id, technicianId) {
        return this.jobService.assignTechnician(id, technicianId);
    }
    async delete(id) {
        return this.jobService.deleteJob(id);
    }
};
exports.JobController = JobController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new job' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Job created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all jobs' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: client_1.JobStatus }),
    (0, swagger_1.ApiQuery)({ name: 'customerId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'technicianId', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of jobs' }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('customerId')),
    __param(2, (0, common_1.Query)('technicianId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('sync'),
    (0, swagger_1.ApiOperation)({ summary: 'Sync jobs for current technician' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false, description: 'Date in YYYY-MM-DD format' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Jobs for the specified date' }),
    __param(0, (0, common_1.Query)('date')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "syncJobs", null);
__decorate([
    (0, common_1.Get)('scheduled'),
    (0, swagger_1.ApiOperation)({ summary: 'Get jobs scheduled for a date range' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, description: 'Start date YYYY-MM-DD' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, description: 'End date YYYY-MM-DD' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Scheduled jobs' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "getScheduledJobs", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a job by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Job UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Job found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Job not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/details'),
    (0, swagger_1.ApiOperation)({ summary: 'Get job with all related data' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Job UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Job with relations' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "getJobDetails", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a job' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Job UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Job updated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Job not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update job status' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Job UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status updated' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid status transition' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/assign'),
    (0, swagger_1.ApiOperation)({ summary: 'Assign technician to job' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Job UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Technician assigned' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)('technicianId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "assignTechnician", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a job' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Job UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Job deleted' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Job not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JobController.prototype, "delete", null);
exports.JobController = JobController = __decorate([
    (0, swagger_1.ApiTags)('jobs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('jobs'),
    __metadata("design:paramtypes", [Function])
], JobController);

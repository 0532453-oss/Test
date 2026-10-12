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
exports.ReportController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let ReportController = class ReportController {
    constructor(reportService) {
        this.reportService = reportService;
    }
    async getDashboardSummary(startDate, endDate) {
        this.validateRequiredDateParams(startDate, endDate);
        const dateRange = this.reportService.validateDateRange(startDate, endDate);
        return this.reportService.getDashboardSummary(dateRange);
    }
    async getRevenueReport(startDate, endDate) {
        this.validateRequiredDateParams(startDate, endDate);
        const dateRange = this.reportService.validateDateRange(startDate, endDate);
        return this.reportService.getRevenueReport(dateRange);
    }
    async getTechnicianPerformanceReport(startDate, endDate) {
        this.validateRequiredDateParams(startDate, endDate);
        const dateRange = this.reportService.validateDateRange(startDate, endDate);
        return this.reportService.getTechnicianPerformanceReport(dateRange);
    }
    async getCustomerAnalytics(startDate, endDate) {
        this.validateRequiredDateParams(startDate, endDate);
        const dateRange = this.reportService.validateDateRange(startDate, endDate);
        return this.reportService.getCustomerAnalytics(dateRange);
    }
    validateRequiredDateParams(startDate, endDate) {
        if (!startDate) {
            throw new common_1.BadRequestException('startDate query parameter is required');
        }
        if (!endDate) {
            throw new common_1.BadRequestException('endDate query parameter is required');
        }
    }
};
exports.ReportController = ReportController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard summary with key metrics' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, example: '2024-01-01' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, example: '2024-12-31' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getDashboardSummary", null);
__decorate([
    (0, common_1.Get)('revenue'),
    (0, swagger_1.ApiOperation)({ summary: 'Get revenue report with breakdown by month and service type' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, example: '2024-01-01' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, example: '2024-12-31' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getRevenueReport", null);
__decorate([
    (0, common_1.Get)('technician-performance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get technician performance report with metrics per technician' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, example: '2024-01-01' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, example: '2024-12-31' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getTechnicianPerformanceReport", null);
__decorate([
    (0, common_1.Get)('customer-analytics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get customer analytics with metrics and trends' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, example: '2024-01-01' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, example: '2024-12-31' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getCustomerAnalytics", null);
exports.ReportController = ReportController = __decorate([
    (0, swagger_1.ApiTags)('reports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('OWNER', 'ADMIN'),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [Function])
], ReportController);

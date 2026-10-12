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
exports.CustomerPortalController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../auth/decorators/public.decorator");
let CustomerPortalController = class CustomerPortalController {
    constructor(portalService) {
        this.portalService = portalService;
    }
    async generateToken(dto) {
        return this.portalService.generatePortalToken(dto.customerId, dto.workspaceId, dto.expiryDays);
    }
    async getPortalData(req, queryToken) {
        const token = this.extractToken(req, queryToken);
        const payload = this.portalService.verifyToken(token);
        return this.portalService.getPortalData(payload.customerId, payload.workspaceId);
    }
    async getInvoices(req, queryToken) {
        const token = this.extractToken(req, queryToken);
        const payload = this.portalService.verifyToken(token);
        const data = await this.portalService.getPortalData(payload.customerId, payload.workspaceId);
        return data.invoices;
    }
    async getInvoiceById(id, req, queryToken) {
        const token = this.extractToken(req, queryToken);
        const payload = this.portalService.verifyToken(token);
        return this.portalService.getInvoiceById(id, payload.customerId, payload.workspaceId);
    }
    async getJobs(req, queryToken) {
        const token = this.extractToken(req, queryToken);
        const payload = this.portalService.verifyToken(token);
        const data = await this.portalService.getPortalData(payload.customerId, payload.workspaceId);
        return data.jobs;
    }
    async getJobById(id, req, queryToken) {
        const token = this.extractToken(req, queryToken);
        const payload = this.portalService.verifyToken(token);
        return this.portalService.getJobById(id, payload.customerId, payload.workspaceId);
    }
    async getPaymentLink(id, req, queryToken) {
        const token = this.extractToken(req, queryToken);
        const payload = this.portalService.verifyToken(token);
        return this.portalService.getInvoicePaymentLink(id, payload.customerId, payload.workspaceId);
    }
    extractToken(req, queryToken) {
        const token = req.headers.authorization?.replace('Bearer ', '') || queryToken;
        if (!token) {
            throw new common_1.BadRequestException('Portal access token is required');
        }
        return token;
    }
};
exports.CustomerPortalController = CustomerPortalController;
__decorate([
    (0, common_1.Post)('generate-token'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Generate a portal access token for a customer' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Token generated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Customer not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], CustomerPortalController.prototype, "generateToken", null);
__decorate([
    (0, common_1.Get)(),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get customer portal data (invoices and jobs)' }),
    (0, swagger_1.ApiQuery)({ name: 'token', required: true, description: 'Portal access token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Portal data returned' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or expired token' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CustomerPortalController.prototype, "getPortalData", null);
__decorate([
    (0, common_1.Get)('invoices'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all invoices for customer' }),
    (0, swagger_1.ApiQuery)({ name: 'token', required: true, description: 'Portal access token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Invoices returned' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or expired token' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CustomerPortalController.prototype, "getInvoices", null);
__decorate([
    (0, common_1.Get)('invoices/:id'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single invoice by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Invoice UUID' }),
    (0, swagger_1.ApiQuery)({ name: 'token', required: true, description: 'Portal access token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Invoice returned' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or expired token' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Invoice not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], CustomerPortalController.prototype, "getInvoiceById", null);
__decorate([
    (0, common_1.Get)('jobs'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all jobs for customer' }),
    (0, swagger_1.ApiQuery)({ name: 'token', required: true, description: 'Portal access token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Jobs returned' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or expired token' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CustomerPortalController.prototype, "getJobs", null);
__decorate([
    (0, common_1.Get)('jobs/:id'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single job by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Job UUID' }),
    (0, swagger_1.ApiQuery)({ name: 'token', required: true, description: 'Portal access token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Job returned' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or expired token' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Job not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], CustomerPortalController.prototype, "getJobById", null);
__decorate([
    (0, common_1.Post)('invoices/:id/pay'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Generate a payment link for an invoice' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Invoice UUID' }),
    (0, swagger_1.ApiQuery)({ name: 'token', required: true, description: 'Portal access token' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Payment link generated' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invoice already paid or Stripe not configured' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or expired token' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Invoice not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], CustomerPortalController.prototype, "getPaymentLink", null);
exports.CustomerPortalController = CustomerPortalController = __decorate([
    (0, swagger_1.ApiTags)('customer-portal'),
    (0, common_1.Controller)('customer-portal'),
    __metadata("design:paramtypes", [Function])
], CustomerPortalController);

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
exports.InvoiceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
let InvoiceController = class InvoiceController {
    constructor(billingService, stripeService) {
        this.billingService = billingService;
        this.stripeService = stripeService;
    }
    async createFromJob(jobId, dto) {
        return this.billingService.createInvoiceFromJob(jobId, {
            dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
            autoSend: dto.autoSend,
        });
    }
    async findAll(status) {
        return this.billingService.findAllInvoices(status);
    }
    async findOne(id) {
        return this.billingService.findInvoiceById(id);
    }
    async findByCustomer(customerId) {
        return this.billingService.findInvoicesByCustomer(customerId);
    }
    async updateStatus(id, dto) {
        return this.billingService.updateInvoiceStatus(id, dto.status);
    }
    async sendInvoice(id) {
        return this.billingService.sendInvoice(id);
    }
    async markPaid(id, stripePaymentId) {
        return this.billingService.markInvoicePaid(id, stripePaymentId);
    }
    async createPaymentLink(id) {
        return this.stripeService.createPaymentLink(id);
    }
    async getPaymentStatus(paymentIntentId) {
        return this.stripeService.getPaymentStatus(paymentIntentId);
    }
};
exports.InvoiceController = InvoiceController;
__decorate([
    (0, common_1.Post)('from-job/:jobId'),
    (0, swagger_1.ApiOperation)({ summary: 'Create invoice from completed job' }),
    (0, swagger_1.ApiParam)({ name: 'jobId', description: 'Job UUID' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Invoice created' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Job not completed' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Job not found' }),
    __param(0, (0, common_1.Param)('jobId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "createFromJob", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all invoices' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: client_1.InvoiceStatus }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of invoices' }),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get invoice by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Invoice UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Invoice found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Invoice not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('by-customer/:customerId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get invoices by customer' }),
    (0, swagger_1.ApiParam)({ name: 'customerId', description: 'Customer UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Customer invoices' }),
    __param(0, (0, common_1.Param)('customerId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "findByCustomer", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update invoice status' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Invoice UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status updated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Invoice not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Function]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/send'),
    (0, swagger_1.ApiOperation)({ summary: 'Send invoice to customer' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Invoice UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Invoice sent' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "sendInvoice", null);
__decorate([
    (0, common_1.Post)(':id/mark-paid'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark invoice as paid' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Invoice UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Invoice marked as paid' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)('stripePaymentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "markPaid", null);
__decorate([
    (0, common_1.Post)(':id/payment-link'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate Stripe payment link for invoice' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Invoice UUID' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Payment link generated' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invoice already paid or Stripe not configured' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Invoice not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "createPaymentLink", null);
__decorate([
    (0, common_1.Get)('payment-status/:paymentIntentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get payment intent status' }),
    (0, swagger_1.ApiParam)({ name: 'paymentIntentId', description: 'Stripe Payment Intent ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payment status returned' }),
    __param(0, (0, common_1.Param)('paymentIntentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InvoiceController.prototype, "getPaymentStatus", null);
exports.InvoiceController = InvoiceController = __decorate([
    (0, swagger_1.ApiTags)('invoices'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('invoices'),
    __metadata("design:paramtypes", [Function, Function])
], InvoiceController);

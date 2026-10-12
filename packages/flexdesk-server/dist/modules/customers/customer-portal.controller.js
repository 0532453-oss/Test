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
const crypto_1 = require("../../utils/crypto");
let CustomerPortalController = class CustomerPortalController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateToken(customerId) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
        });
        if (!customer) {
            throw new common_1.BadRequestException('Customer not found');
        }
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        const exp = Math.floor(expiresAt.getTime() / 1000);
        const token = (0, crypto_1.signCustomerPortalToken)({
            customerId: customer.id,
            workspaceId: customer.workspaceId,
            exp,
        });
        return { token, expiresAt };
    }
    async getInvoices(token) {
        const payload = this.verifyTokenOrThrow(token);
        const customer = await this.prisma.customer.findFirst({
            where: {
                id: payload.customerId,
                workspaceId: payload.workspaceId,
            },
        });
        if (!customer) {
            throw new common_1.UnauthorizedException('Customer not found');
        }
        const invoices = await this.prisma.invoice.findMany({
            where: {
                customerId: payload.customerId,
                workspaceId: payload.workspaceId,
            },
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                        completedAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return {
            customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
            },
            invoices: invoices.map((inv) => ({
                id: inv.id,
                invoiceNumber: inv.invoiceNumber,
                status: inv.status,
                amount: Number(inv.amount),
                tax: Number(inv.tax),
                total: Number(inv.total),
                dueDate: inv.dueDate,
                paidAt: inv.paidAt,
                createdAt: inv.createdAt,
                job: inv.job,
            })),
        };
    }
    async getInvoiceDetail(invoiceId, token) {
        const payload = this.verifyTokenOrThrow(token);
        const customer = await this.prisma.customer.findFirst({
            where: {
                id: payload.customerId,
                workspaceId: payload.workspaceId,
            },
        });
        if (!customer) {
            throw new common_1.UnauthorizedException('Customer not found');
        }
        const invoice = await this.prisma.invoice.findFirst({
            where: {
                id: invoiceId,
                customerId: payload.customerId,
                workspaceId: payload.workspaceId,
            },
            include: {
                job: {
                    select: {
                        id: true,
                        title: true,
                        completedAt: true,
                    },
                },
                lineItems: true,
            },
        });
        if (!invoice) {
            throw new common_1.BadRequestException('Invoice not found');
        }
        return {
            customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
            },
            invoice: {
                id: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                status: invoice.status,
                amount: Number(invoice.amount),
                tax: Number(invoice.tax),
                total: Number(invoice.total),
                dueDate: invoice.dueDate,
                paidAt: invoice.paidAt,
                createdAt: invoice.createdAt,
                job: invoice.job,
                lineItems: invoice.lineItems.map((item) => ({
                    id: item.id,
                    description: item.description,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice),
                    total: Number(item.total),
                })),
            },
        };
    }
    async getJobs(token) {
        const payload = this.verifyTokenOrThrow(token);
        const customer = await this.prisma.customer.findFirst({
            where: {
                id: payload.customerId,
                workspaceId: payload.workspaceId,
            },
        });
        if (!customer) {
            throw new common_1.UnauthorizedException('Customer not found');
        }
        const jobs = await this.prisma.job.findMany({
            where: {
                customerId: payload.customerId,
                workspaceId: payload.workspaceId,
            },
            orderBy: { scheduledAt: 'desc' },
        });
        return {
            customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
            },
            jobs: jobs.map((job) => ({
                id: job.id,
                title: job.title,
                description: job.description,
                status: job.status,
                scheduledAt: job.scheduledAt,
                startedAt: job.startedAt,
                completedAt: job.completedAt,
                createdAt: job.createdAt,
            })),
        };
    }
    verifyTokenOrThrow(token) {
        if (!token) {
            throw new common_1.BadRequestException('Missing portal access token');
        }
        const payload = (0, crypto_1.verifyCustomerPortalToken)(token);
        if (!payload) {
            throw new common_1.UnauthorizedException('Invalid or expired portal access token');
        }
        return payload;
    }
};
exports.CustomerPortalController = CustomerPortalController;
__decorate([
    (0, common_1.Post)('generate-token/:customerId'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate customer portal access token' }),
    (0, swagger_1.ApiParam)({ name: 'customerId', description: 'Customer UUID' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Token generated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Customer not found' }),
    __param(0, (0, common_1.Param)('customerId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomerPortalController.prototype, "generateToken", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('invoices'),
    (0, swagger_1.ApiOperation)({ summary: 'Get customer invoices via portal token' }),
    (0, swagger_1.ApiQuery)({ name: 'token', required: true, description: 'Portal access token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of customer invoices' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or expired token' }),
    __param(0, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomerPortalController.prototype, "getInvoices", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('invoices/:invoiceId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get invoice detail via portal token' }),
    (0, swagger_1.ApiParam)({ name: 'invoiceId', description: 'Invoice UUID' }),
    (0, swagger_1.ApiQuery)({ name: 'token', required: true, description: 'Portal access token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Invoice detail' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or expired token' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Invoice not found' }),
    __param(0, (0, common_1.Param)('invoiceId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CustomerPortalController.prototype, "getInvoiceDetail", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('jobs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get customer job history via portal token' }),
    (0, swagger_1.ApiQuery)({ name: 'token', required: true, description: 'Portal access token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of customer jobs' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or expired token' }),
    __param(0, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomerPortalController.prototype, "getJobs", null);
exports.CustomerPortalController = CustomerPortalController = __decorate([
    (0, swagger_1.ApiTags)('customer-portal'),
    (0, common_1.Controller)('portal'),
    __metadata("design:paramtypes", [Function])
], CustomerPortalController);

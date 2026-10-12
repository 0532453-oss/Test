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
exports.CustomerPortalService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("../../utils/crypto");
const DEFAULT_TOKEN_EXPIRY_DAYS = 30;
let CustomerPortalService = class CustomerPortalService {
    constructor(prisma, stripeService) {
        this.prisma = prisma;
        this.stripeService = stripeService;
    }
    async generatePortalToken(customerId, workspaceId, expiryDays = DEFAULT_TOKEN_EXPIRY_DAYS) {
        const customer = await this.prisma.customer.findFirst({
            where: { id: customerId, workspaceId },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiryDays);
        const payload = {
            customerId,
            workspaceId,
            exp: Math.floor(expiresAt.getTime() / 1000),
        };
        const token = (0, crypto_1.signCustomerPortalToken)(payload);
        return {
            token,
            expiresAt,
        };
    }
    verifyToken(token) {
        const payload = (0, crypto_1.verifyCustomerPortalToken)(token);
        if (!payload) {
            throw new common_1.UnauthorizedException('Invalid or expired portal token');
        }
        return payload;
    }
    async getPortalData(customerId, workspaceId) {
        const customer = await this.prisma.customer.findFirst({
            where: { id: customerId, workspaceId },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
        const [invoices, jobs] = await Promise.all([
            this.getCustomerInvoices(customerId, workspaceId),
            this.getCustomerJobs(customerId, workspaceId),
        ]);
        return {
            customer: {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
            },
            invoices,
            jobs,
        };
    }
    async getInvoiceById(invoiceId, customerId, workspaceId) {
        const invoice = await this.prisma.invoice.findFirst({
            where: {
                id: invoiceId,
                customerId,
                workspaceId,
            },
            include: {
                job: true,
                lineItems: true,
            },
        });
        if (!invoice) {
            throw new common_1.NotFoundException('Invoice not found');
        }
        return this.mapInvoiceToSummary(invoice);
    }
    async getJobById(jobId, customerId, workspaceId) {
        const job = await this.prisma.job.findFirst({
            where: {
                id: jobId,
                customerId,
                workspaceId,
            },
            include: {
                technician: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        return this.mapJobToSummary(job);
    }
    async getCustomerInvoices(customerId, workspaceId) {
        const invoices = await this.prisma.invoice.findMany({
            where: { customerId, workspaceId },
            include: {
                job: true,
                lineItems: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return invoices.map((invoice) => this.mapInvoiceToSummary(invoice));
    }
    async getCustomerJobs(customerId, workspaceId) {
        const jobs = await this.prisma.job.findMany({
            where: { customerId, workspaceId },
            include: {
                technician: {
                    include: {
                        user: true,
                    },
                },
            },
            orderBy: { scheduledAt: 'desc' },
        });
        return jobs.map((job) => this.mapJobToSummary(job));
    }
    mapInvoiceToSummary(invoice) {
        return {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status,
            amount: invoice.amount.toString(),
            tax: invoice.tax.toString(),
            total: invoice.total.toString(),
            dueDate: invoice.dueDate,
            paidAt: invoice.paidAt,
            createdAt: invoice.createdAt,
            job: invoice.job
                ? {
                    id: invoice.job.id,
                    title: invoice.job.title,
                }
                : null,
            lineItems: (invoice.lineItems ?? []).map((item) => ({
                description: item.description,
                quantity: item.quantity.toString(),
                unitPrice: item.unitPrice.toString(),
                total: item.total.toString(),
            })),
        };
    }
    mapJobToSummary(job) {
        const technician = job.technician;
        let technicianName = 'Unassigned';
        if (technician?.user) {
            const firstName = technician.user.firstName ?? '';
            const lastName = technician.user.lastName ?? '';
            technicianName = `${firstName} ${lastName}`.trim() || 'Technician';
        }
        return {
            id: job.id,
            title: job.title,
            description: job.description,
            status: job.status,
            scheduledAt: job.scheduledAt,
            completedAt: job.completedAt,
            technician: technician
                ? {
                    id: technician.id,
                    name: technicianName,
                }
                : null,
        };
    }
    async getInvoicePaymentLink(invoiceId, customerId, workspaceId) {
        return this.stripeService.createPaymentLinkForPortal(invoiceId, customerId, workspaceId);
    }
};
exports.CustomerPortalService = CustomerPortalService;
exports.CustomerPortalService = CustomerPortalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function, Function])
], CustomerPortalService);

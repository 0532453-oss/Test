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
var BillingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const workspace_context_1 = require("../../../core/database/workspace-context");
const DEFAULT_HOURLY_RATE = parseFloat(process.env.DEFAULT_JOB_HOURLY_RATE ?? '100');
const DEFAULT_TAX_RATE = parseFloat(process.env.DEFAULT_TAX_RATE ?? '0.1');
const DEFAULT_DUE_DATE_DAYS = parseInt(process.env.DEFAULT_INVOICE_DUE_DATE_DAYS ?? '30', 10);
let BillingService = BillingService_1 = class BillingService {
    constructor(prisma, notificationService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
        this.logger = new common_1.Logger(BillingService_1.name);
    }
    getWorkspaceIdOrThrow() {
        const workspaceId = (0, workspace_context_1.getWorkspaceId)();
        if (!workspaceId) {
            throw new common_1.BadRequestException('Workspace context is required');
        }
        return workspaceId;
    }
    async findAllInvoices(status) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const where = { workspaceId };
        if (status) {
            where.status = status;
        }
        return this.prisma.invoice.findMany({
            where,
            include: {
                customer: true,
                job: true,
                lineItems: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findInvoiceById(id) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const invoice = await this.prisma.invoice.findFirst({
            where: { id, workspaceId },
            include: {
                customer: true,
                job: true,
                lineItems: true,
            },
        });
        if (!invoice) {
            throw new common_1.NotFoundException('Invoice not found');
        }
        return invoice;
    }
    async findInvoicesByCustomer(customerId) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        return this.prisma.invoice.findMany({
            where: { workspaceId, customerId },
            include: {
                job: true,
                lineItems: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateInvoiceStatus(id, status) {
        const invoice = await this.findInvoiceById(id);
        return this.prisma.invoice.update({
            where: { id },
            data: {
                status,
                syncStatus: client_1.SyncStatus.PENDING,
                syncVersion: invoice.syncVersion + 1,
                ...(status === client_1.InvoiceStatus.PAID && { paidAt: new Date() }),
            },
            include: {
                customer: true,
                lineItems: true,
            },
        });
    }
    async sendInvoice(id) {
        const invoice = await this.findInvoiceById(id);
        if (invoice.status !== client_1.InvoiceStatus.DRAFT) {
            throw new common_1.BadRequestException('Only draft invoices can be sent');
        }
        const updatedInvoice = await this.prisma.invoice.update({
            where: { id },
            data: {
                status: client_1.InvoiceStatus.SENT,
                syncStatus: client_1.SyncStatus.PENDING,
                syncVersion: invoice.syncVersion + 1,
            },
            include: {
                customer: {
                    include: {
                        notificationPreference: true,
                    },
                },
                lineItems: true,
            },
        });
        if (updatedInvoice.customer) {
            try {
                await this.notificationService.notifyInvoiceSent(updatedInvoice, updatedInvoice.customer);
                this.logger.log(`Invoice sent notification delivered for invoice ${updatedInvoice.invoiceNumber}`);
            }
            catch (error) {
                this.logger.error(`Failed to send invoice notification: ${error}`);
            }
        }
        return updatedInvoice;
    }
    async markInvoicePaid(id, stripePaymentId) {
        const invoice = await this.findInvoiceById(id);
        return this.prisma.invoice.update({
            where: { id },
            data: {
                status: client_1.InvoiceStatus.PAID,
                paidAt: new Date(),
                stripePaymentId,
                syncStatus: client_1.SyncStatus.PENDING,
                syncVersion: invoice.syncVersion + 1,
            },
            include: {
                customer: true,
                lineItems: true,
            },
        });
    }
    async createInvoiceFromJob(jobId, options = {}) {
        const job = await this.prisma.job.findFirst({
            where: { id: jobId },
            include: {
                customer: true,
            },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        if (job.status !== client_1.JobStatus.COMPLETED) {
            throw new common_1.BadRequestException('Invoice can only be created for completed jobs');
        }
        const estimatedDurationMinutes = typeof job.estimatedDuration === 'number' && job.estimatedDuration > 0
            ? job.estimatedDuration
            : 60;
        const baseAmountNumber = (estimatedDurationMinutes / 60) * DEFAULT_HOURLY_RATE;
        const taxNumber = baseAmountNumber * DEFAULT_TAX_RATE;
        const totalNumber = baseAmountNumber + taxNumber;
        const amount = new client_1.Prisma.Decimal(baseAmountNumber.toFixed(2));
        const tax = new client_1.Prisma.Decimal(taxNumber.toFixed(2));
        const total = new client_1.Prisma.Decimal(totalNumber.toFixed(2));
        const now = new Date();
        const dueDate = options.dueDate ??
            new Date(now.getTime() + DEFAULT_DUE_DATE_DAYS * 24 * 60 * 60 * 1000);
        const invoiceNumber = this.generateInvoiceNumber();
        const initialStatus = options.autoSend ? client_1.InvoiceStatus.SENT : client_1.InvoiceStatus.DRAFT;
        const invoice = await this.prisma.invoice.create({
            data: {
                workspaceId: job.workspaceId,
                jobId: job.id,
                customerId: job.customerId,
                invoiceNumber,
                status: initialStatus,
                amount,
                tax,
                total,
                dueDate,
                lineItems: {
                    create: {
                        description: `Service for job: ${job.title}`,
                        quantity: new client_1.Prisma.Decimal(1),
                        unitPrice: amount,
                        total: amount,
                    },
                },
            },
            include: {
                lineItems: true,
                customer: {
                    include: {
                        notificationPreference: true,
                    },
                },
            },
        });
        if (options.autoSend && invoice.customer) {
            try {
                await this.notificationService.notifyInvoiceSent(invoice, invoice.customer);
                this.logger.log(`Invoice created and sent notification delivered for invoice ${invoice.invoiceNumber}`);
            }
            catch (error) {
                this.logger.error(`Failed to send invoice creation notification: ${error}`);
            }
        }
        return invoice;
    }
    generateInvoiceNumber() {
        const now = new Date();
        const datePart = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0'),
        ].join('');
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `INV-${datePart}-${randomPart}`;
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = BillingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function, Function])
], BillingService);

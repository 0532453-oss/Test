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
var InvoiceGenerationProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceGenerationProcessor = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const workspace_context_1 = require("../../core/database/workspace-context");
const DEFAULT_HOURLY_RATE = parseFloat(process.env.DEFAULT_JOB_HOURLY_RATE ?? '100');
const DEFAULT_TAX_RATE = parseFloat(process.env.DEFAULT_TAX_RATE ?? '0.1');
const DEFAULT_DUE_DATE_DAYS = parseInt(process.env.DEFAULT_INVOICE_DUE_DATE_DAYS ?? '30', 10);
let InvoiceGenerationProcessor = InvoiceGenerationProcessor_1 = class InvoiceGenerationProcessor {
    constructor(prisma, notificationService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
        this.logger = new common_1.Logger(InvoiceGenerationProcessor_1.name);
    }
    async generateInvoicesForCompletedJobs() {
        this.logger.debug('Checking for completed jobs without invoices...');
        try {
            const completedJobsWithoutInvoice = await this.prisma.job.findMany({
                where: {
                    status: client_1.JobStatus.COMPLETED,
                    invoice: null,
                    completedAt: { not: null },
                },
                include: {
                    customer: {
                        include: {
                            notificationPreference: true,
                        },
                    },
                },
                take: 50,
            });
            if (completedJobsWithoutInvoice.length === 0) {
                return;
            }
            this.logger.log(`Found ${completedJobsWithoutInvoice.length} jobs needing invoices`);
            let successCount = 0;
            for (const job of completedJobsWithoutInvoice) {
                try {
                    const invoice = await (0, workspace_context_1.runWithWorkspace)(job.workspaceId, () => this.createInvoiceForJob(job));
                    if (invoice && job.customer) {
                        try {
                            await this.notificationService.notifyInvoiceSent(invoice, job.customer);
                        }
                        catch (notifyError) {
                            this.logger.error(`Failed to send invoice notification for job ${job.id}`, notifyError);
                        }
                    }
                    successCount++;
                    this.logger.log(`Generated invoice ${invoice.invoiceNumber} for job ${job.id}`);
                }
                catch (error) {
                    this.logger.error(`Failed to generate invoice for job ${job.id}`, error);
                }
            }
            this.logger.log(`Generated ${successCount}/${completedJobsWithoutInvoice.length} invoices`);
        }
        catch (error) {
            this.logger.error('Failed to generate invoices', error);
        }
    }
    async sendPaymentReminders() {
        this.logger.log('Sending payment reminders for overdue invoices...');
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        try {
            const overdueInvoices = await this.prisma.invoice.findMany({
                where: {
                    status: client_1.InvoiceStatus.SENT,
                    dueDate: { lt: now },
                    createdAt: { gt: thirtyDaysAgo },
                },
                include: {
                    customer: {
                        include: {
                            notificationPreference: true,
                        },
                    },
                },
            });
            if (overdueInvoices.length === 0) {
                this.logger.debug('No overdue invoices found');
                return;
            }
            this.logger.log(`Found ${overdueInvoices.length} overdue invoices`);
            let sentCount = 0;
            for (const invoice of overdueInvoices) {
                if (!invoice.customer)
                    continue;
                try {
                    await this.notificationService.notifyInvoiceSent(invoice, invoice.customer);
                    sentCount++;
                }
                catch (error) {
                    this.logger.error(`Failed to send reminder for invoice ${invoice.id}`, error);
                }
            }
            this.logger.log(`Sent ${sentCount} payment reminders`);
        }
        catch (error) {
            this.logger.error('Failed to send payment reminders', error);
        }
    }
    async sendUpcomingDueReminders() {
        this.logger.debug('Checking for invoices due soon...');
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const fourDaysFromNow = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
        try {
            const soonDueInvoices = await this.prisma.invoice.findMany({
                where: {
                    status: client_1.InvoiceStatus.SENT,
                    dueDate: {
                        gte: threeDaysFromNow,
                        lt: fourDaysFromNow,
                    },
                },
                include: {
                    customer: {
                        include: {
                            notificationPreference: true,
                        },
                    },
                },
            });
            if (soonDueInvoices.length === 0) {
                return;
            }
            this.logger.log(`Found ${soonDueInvoices.length} invoices due in 3 days`);
            for (const invoice of soonDueInvoices) {
                if (!invoice.customer || !invoice.customer.email)
                    continue;
                try {
                    await this.notificationService.sendEmail({
                        to: invoice.customer.email,
                        subject: `Friendly reminder: Invoice ${invoice.invoiceNumber} due in 3 days`,
                        template: 'invoice-sent',
                        context: {
                            customerName: invoice.customer.name,
                            invoiceNumber: invoice.invoiceNumber,
                            amount: invoice.total.toString(),
                            dueDate: invoice.dueDate,
                            invoiceLink: `${process.env.PUBLIC_APP_URL || ''}/invoices/${invoice.id}`,
                        },
                    });
                }
                catch (error) {
                    this.logger.error(`Failed to send due reminder for invoice ${invoice.id}`, error);
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to send upcoming due reminders', error);
        }
    }
    async createInvoiceForJob(job) {
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
        const dueDate = new Date(now.getTime() + DEFAULT_DUE_DATE_DAYS * 24 * 60 * 60 * 1000);
        const invoiceNumber = this.generateInvoiceNumber();
        return this.prisma.invoice.create({
            data: {
                workspaceId: job.workspaceId,
                jobId: job.id,
                customerId: job.customerId,
                invoiceNumber,
                status: client_1.InvoiceStatus.SENT,
                amount,
                tax,
                total,
                dueDate,
                syncStatus: client_1.SyncStatus.PENDING,
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
                customer: true,
            },
        });
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
exports.InvoiceGenerationProcessor = InvoiceGenerationProcessor;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InvoiceGenerationProcessor.prototype, "generateInvoicesForCompletedJobs", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_9AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InvoiceGenerationProcessor.prototype, "sendPaymentReminders", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_10AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InvoiceGenerationProcessor.prototype, "sendUpcomingDueReminders", null);
exports.InvoiceGenerationProcessor = InvoiceGenerationProcessor = InvoiceGenerationProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function, Function])
], InvoiceGenerationProcessor);

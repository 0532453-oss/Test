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
var ReportGenerationProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportGenerationProcessor = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const workspace_context_1 = require("../../core/database/workspace-context");
let ReportGenerationProcessor = ReportGenerationProcessor_1 = class ReportGenerationProcessor {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ReportGenerationProcessor_1.name);
    }
    async generateDailySummary() {
        this.logger.log('Generating daily summary reports...');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        try {
            const workspaces = await this.prisma.workspace.findMany();
            for (const workspace of workspaces) {
                await (0, workspace_context_1.runWithWorkspace)(workspace.id, async () => {
                    const [completedJobs, newCustomers, revenue] = await Promise.all([
                        this.prisma.job.count({
                            where: {
                                completedAt: { gte: today, lt: tomorrow },
                            },
                        }),
                        this.prisma.customer.count({
                            where: {
                                createdAt: { gte: today, lt: tomorrow },
                            },
                        }),
                        this.prisma.invoice.aggregate({
                            where: {
                                paidAt: { gte: today, lt: tomorrow },
                            },
                            _sum: { total: true },
                        }),
                    ]);
                    this.logger.log(`[Daily] Workspace ${workspace.id}: ${completedJobs} jobs, ${newCustomers} customers, $${revenue._sum.total || 0} revenue`);
                });
            }
        }
        catch (error) {
            this.logger.error('Failed to generate daily summary', error);
        }
    }
    async generateWeeklyReport() {
        this.logger.log('Generating weekly performance reports...');
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        try {
            const workspaces = await this.prisma.workspace.findMany();
            for (const workspace of workspaces) {
                await (0, workspace_context_1.runWithWorkspace)(workspace.id, async () => {
                    const report = await this.buildWeeklyReport(workspace.id, startDate, endDate);
                    this.logger.log(`[Weekly] Workspace ${workspace.id}: ` +
                        `${report.jobs.completed} completed, ` +
                        `$${report.revenue.collected} collected, ` +
                        `${report.customers.newCustomers} new customers`);
                    this.logger.debug(JSON.stringify(report));
                });
            }
        }
        catch (error) {
            this.logger.error('Failed to generate weekly report', error);
        }
    }
    async buildWeeklyReport(workspaceId, startDate, endDate) {
        const [completedJobs, scheduledJobs, cancelledJobs, newCustomers, totalCustomers, invoicedRevenue, collectedRevenue, outstandingRevenue, technicianJobs,] = await Promise.all([
            this.prisma.job.count({
                where: {
                    workspaceId,
                    completedAt: { gte: startDate, lt: endDate },
                },
            }),
            this.prisma.job.count({
                where: {
                    workspaceId,
                    status: 'SCHEDULED',
                    createdAt: { gte: startDate, lt: endDate },
                },
            }),
            this.prisma.job.count({
                where: {
                    workspaceId,
                    status: 'CANCELLED',
                    updatedAt: { gte: startDate, lt: endDate },
                },
            }),
            this.prisma.customer.count({
                where: {
                    workspaceId,
                    createdAt: { gte: startDate, lt: endDate },
                },
            }),
            this.prisma.customer.count({
                where: { workspaceId },
            }),
            this.prisma.invoice.aggregate({
                where: {
                    workspaceId,
                    createdAt: { gte: startDate, lt: endDate },
                },
                _sum: { total: true },
            }),
            this.prisma.invoice.aggregate({
                where: {
                    workspaceId,
                    paidAt: { gte: startDate, lt: endDate },
                },
                _sum: { total: true },
            }),
            this.prisma.invoice.aggregate({
                where: {
                    workspaceId,
                    status: 'SENT',
                },
                _sum: { total: true },
            }),
            this.prisma.job.groupBy({
                by: ['technicianId'],
                where: {
                    workspaceId,
                    completedAt: { gte: startDate, lt: endDate },
                    technicianId: { not: null },
                },
                _count: true,
            }),
        ]);
        const jobsPerTechnician = {};
        for (const entry of technicianJobs) {
            if (entry.technicianId) {
                jobsPerTechnician[entry.technicianId] = entry._count;
            }
        }
        const activeTechnicians = Object.keys(jobsPerTechnician).length;
        return {
            workspaceId,
            period: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
            jobs: {
                completed: completedJobs,
                scheduled: scheduledJobs,
                cancelled: cancelledJobs,
                averageCompletionMinutes: 0,
            },
            revenue: {
                invoiced: Number(invoicedRevenue._sum.total || 0),
                collected: Number(collectedRevenue._sum.total || 0),
                outstanding: Number(outstandingRevenue._sum.total || 0),
            },
            customers: {
                newCustomers,
                totalActive: totalCustomers,
            },
            technicians: {
                totalActive: activeTechnicians,
                jobsPerTechnician,
            },
            generatedAt: new Date().toISOString(),
        };
    }
};
exports.ReportGenerationProcessor = ReportGenerationProcessor;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_11PM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportGenerationProcessor.prototype, "generateDailySummary", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_WEEK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportGenerationProcessor.prototype, "generateWeeklyReport", null);
exports.ReportGenerationProcessor = ReportGenerationProcessor = ReportGenerationProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function])
], ReportGenerationProcessor);

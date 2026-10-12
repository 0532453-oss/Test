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
var JobNotificationProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobNotificationProcessor = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
let JobNotificationProcessor = JobNotificationProcessor_1 = class JobNotificationProcessor {
    constructor(prisma, notificationService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
        this.logger = new common_1.Logger(JobNotificationProcessor_1.name);
    }
    async sendDailyJobReminders() {
        this.logger.log('Processing daily job reminders...');
        const todayString = new Date().toISOString().split('T')[0];
        try {
            const jobs = await this.prisma.job.findMany({
                where: {
                    scheduledDate: todayString,
                    status: { in: ['SCHEDULED'] },
                },
                include: {
                    technician: true,
                    customer: {
                        include: {
                            notificationPreference: true,
                        },
                    },
                },
            });
            this.logger.log(`Found ${jobs.length} jobs scheduled for today`);
            let sentCount = 0;
            for (const job of jobs) {
                if (!job.customer)
                    continue;
                try {
                    await this.notificationService.notifyJobReminder(job, job.customer, 24);
                    sentCount++;
                }
                catch (error) {
                    this.logger.error(`Failed to send reminder for job ${job.id}`, error);
                }
            }
            this.logger.log(`Sent ${sentCount} job reminders`);
        }
        catch (error) {
            this.logger.error('Failed to process job reminders', error);
        }
    }
    async sendUpcomingJobReminders() {
        this.logger.debug('Checking for jobs starting in ~2 hours...');
        const now = new Date();
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const twoAndHalfHoursFromNow = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);
        try {
            const jobs = await this.prisma.job.findMany({
                where: {
                    status: 'SCHEDULED',
                    scheduledAt: {
                        gte: twoHoursFromNow,
                        lt: twoAndHalfHoursFromNow,
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
            for (const job of jobs) {
                if (!job.customer)
                    continue;
                try {
                    await this.notificationService.notifyJobReminder(job, job.customer, 2);
                }
                catch (error) {
                    this.logger.error(`Failed to send 2-hour reminder for job ${job.id}`, error);
                }
            }
            if (jobs.length > 0) {
                this.logger.log(`Sent ${jobs.length} upcoming job reminders`);
            }
        }
        catch (error) {
            this.logger.error('Failed to send upcoming job reminders', error);
        }
    }
    async checkOverdueJobs() {
        this.logger.debug('Checking for overdue jobs...');
        const todayString = new Date().toISOString().split('T')[0];
        try {
            const overdueJobs = await this.prisma.job.findMany({
                where: {
                    status: 'IN_PROGRESS',
                    scheduledDate: {
                        lt: todayString,
                    },
                },
                include: {
                    technician: true,
                    workspace: true,
                },
            });
            if (overdueJobs.length > 0) {
                this.logger.warn(`Found ${overdueJobs.length} overdue jobs`);
                const byWorkspace = new Map();
                for (const job of overdueJobs) {
                    const existing = byWorkspace.get(job.workspaceId) || [];
                    existing.push(job);
                    byWorkspace.set(job.workspaceId, existing);
                }
                for (const [workspaceId, jobs] of byWorkspace) {
                    this.logger.warn(`Workspace ${workspaceId}: ${jobs.length} overdue jobs - ` +
                        jobs.map(j => `${j.id} (${j.title})`).join(', '));
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to check overdue jobs', error);
        }
    }
    async checkUnassignedJobs() {
        this.logger.log('Checking for unassigned jobs scheduled soon...');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = tomorrow.toISOString().split('T')[0];
        try {
            const unassignedJobs = await this.prisma.job.findMany({
                where: {
                    status: 'SCHEDULED',
                    technicianId: null,
                    scheduledDate: {
                        lte: tomorrowString,
                    },
                },
                include: {
                    workspace: true,
                },
            });
            if (unassignedJobs.length > 0) {
                this.logger.warn(`Found ${unassignedJobs.length} unassigned jobs scheduled for today/tomorrow`);
                const byWorkspace = new Map();
                for (const job of unassignedJobs) {
                    byWorkspace.set(job.workspaceId, (byWorkspace.get(job.workspaceId) || 0) + 1);
                }
                for (const [workspaceId, count] of byWorkspace) {
                    this.logger.warn(`Workspace ${workspaceId}: ${count} unassigned jobs need attention`);
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to check unassigned jobs', error);
        }
    }
};
exports.JobNotificationProcessor = JobNotificationProcessor;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_7AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JobNotificationProcessor.prototype, "sendDailyJobReminders", null);
__decorate([
    (0, schedule_1.Cron)('0,30 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JobNotificationProcessor.prototype, "sendUpcomingJobReminders", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JobNotificationProcessor.prototype, "checkOverdueJobs", null);
__decorate([
    (0, schedule_1.Cron)('0 8,10,12,14,16 * * 1-5'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JobNotificationProcessor.prototype, "checkUnassignedJobs", null);
exports.JobNotificationProcessor = JobNotificationProcessor = JobNotificationProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function, Function])
], JobNotificationProcessor);

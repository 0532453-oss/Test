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
exports.RecurrenceService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const base_service_1 = require("../../engine/base.service");
let RecurrenceService = class RecurrenceService extends base_service_1.BaseService {
    constructor(prisma) {
        super(prisma, prisma.recurringJobTemplate, 'RecurringJobTemplate');
    }
    async createTemplate(data) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const tempTemplate = {
            id: '',
            workspaceId,
            customerId: data.customerId,
            technicianId: data.technicianId || null,
            propertyId: data.propertyId || null,
            title: data.title,
            description: data.description || null,
            priority: data.priority || 'MEDIUM',
            frequency: data.frequency,
            interval: data.interval || 1,
            dayOfWeek: data.dayOfWeek ?? null,
            dayOfMonth: data.dayOfMonth ?? null,
            startDate: data.startDate,
            endDate: data.endDate || null,
            nextRunDate: data.startDate,
            estimatedDuration: data.estimatedDuration || null,
            location: (data.location ?? null),
            isActive: true,
            syncStatus: client_1.SyncStatus.PENDING,
            lastSyncedAt: null,
            syncVersion: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const nextRunDate = this.calculateNextRunDate(tempTemplate, data.startDate);
        return await this.prisma.recurringJobTemplate.create({
            data: {
                workspaceId,
                customerId: data.customerId,
                technicianId: data.technicianId || undefined,
                title: data.title,
                description: data.description || undefined,
                priority: data.priority || 'MEDIUM',
                frequency: data.frequency,
                interval: data.interval || 1,
                dayOfWeek: data.dayOfWeek ?? undefined,
                dayOfMonth: data.dayOfMonth ?? undefined,
                startDate: data.startDate,
                endDate: data.endDate || undefined,
                nextRunDate,
                estimatedDuration: data.estimatedDuration || undefined,
                location: data.location || undefined,
                isActive: true,
                syncStatus: client_1.SyncStatus.PENDING,
                syncVersion: 0,
            },
        });
    }
    calculateNextRunDate(template, fromDate) {
        const baseDate = fromDate || new Date(template.nextRunDate);
        const result = new Date(baseDate);
        switch (template.frequency) {
            case 'WEEKLY': {
                const targetDayOfWeek = template.dayOfWeek ?? 0;
                const currentDayOfWeek = result.getDay();
                let daysToAdd = targetDayOfWeek - currentDayOfWeek;
                if (daysToAdd <= 0) {
                    daysToAdd = template.interval * 7;
                }
                else {
                }
                result.setDate(result.getDate() + daysToAdd);
                break;
            }
            case 'BIWEEKLY': {
                result.setDate(result.getDate() + 14);
                break;
            }
            case 'MONTHLY': {
                result.setMonth(result.getMonth() + (template.interval || 1));
                if (template.dayOfMonth !== null && template.dayOfMonth !== undefined) {
                    const lastDayOfMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
                    result.setDate(Math.min(template.dayOfMonth, lastDayOfMonth));
                }
                break;
            }
            case 'CUSTOM': {
                result.setDate(result.getDate() + (template.interval || 1));
                break;
            }
            default:
                throw new common_1.BadRequestException(`Unsupported frequency: ${template.frequency}`);
        }
        if (template.endDate && result > template.endDate) {
            throw new common_1.BadRequestException('Next run date exceeds template end date');
        }
        return result;
    }
    async canGenerateJobForDate(templateId, scheduledAt) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const startOfDay = new Date(scheduledAt);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(scheduledAt);
        endOfDay.setHours(23, 59, 59, 999);
        const existing = await this.prisma.job.findFirst({
            where: {
                workspaceId,
                recurringTemplateId: templateId,
                scheduledAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
        });
        return !existing;
    }
    async generateJobFromTemplate(templateId, targetDate) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        const existing = await this.prisma.job.findFirst({
            where: {
                workspaceId,
                recurringTemplateId: templateId,
                scheduledAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
        });
        if (existing) {
            return existing;
        }
        try {
            return await this.prisma.$transaction(async (tx) => {
                const template = await tx.recurringJobTemplate.findFirst({
                    where: {
                        id: templateId,
                        workspaceId,
                    },
                });
                if (!template) {
                    throw new common_1.NotFoundException(`RecurringJobTemplate with id ${templateId} not found`);
                }
                if (!template.isActive) {
                    throw new common_1.BadRequestException('Cannot generate job from inactive template');
                }
                const existingInTx = await tx.job.findFirst({
                    where: {
                        workspaceId,
                        recurringTemplateId: templateId,
                        scheduledAt: {
                            gte: startOfDay,
                            lte: endOfDay,
                        },
                    },
                });
                if (existingInTx) {
                    return existingInTx;
                }
                const jobData = {
                    workspace: { connect: { id: workspaceId } },
                    customer: { connect: { id: template.customerId } },
                    title: template.title,
                    description: template.description || undefined,
                    priority: template.priority,
                    status: client_1.JobStatus.SCHEDULED,
                    scheduledAt: targetDate,
                    estimatedDuration: template.estimatedDuration || undefined,
                    location: template.location,
                    recurringTemplate: { connect: { id: templateId } },
                    syncStatus: client_1.SyncStatus.PENDING,
                    syncVersion: 0,
                };
                if (template.technicianId) {
                    jobData.technician = { connect: { id: template.technicianId } };
                }
                const job = await tx.job.create({
                    data: jobData,
                });
                const nextRunDate = this.calculateNextRunDate(template, targetDate);
                await tx.recurringJobTemplate.update({
                    where: { id: templateId },
                    data: {
                        nextRunDate,
                        syncVersion: template.syncVersion + 1,
                        syncStatus: client_1.SyncStatus.PENDING,
                        updatedAt: new Date(),
                    },
                });
                return job;
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                const existingJob = await this.prisma.job.findFirst({
                    where: {
                        workspaceId,
                        recurringTemplateId: templateId,
                        scheduledAt: {
                            gte: startOfDay,
                            lte: endOfDay,
                        },
                    },
                });
                if (existingJob) {
                    return existingJob;
                }
            }
            throw error;
        }
    }
    async reconcileTemplateSync(localTemplate, serverTemplate) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        if (localTemplate.id !== serverTemplate.id) {
            throw new common_1.BadRequestException('Cannot reconcile templates with different IDs');
        }
        let resolvedTemplate;
        const regeneratedJobs = [];
        if (serverTemplate.syncVersion > localTemplate.syncVersion) {
            resolvedTemplate = serverTemplate;
            if (serverTemplate.nextRunDate < localTemplate.nextRunDate) {
                const serverGeneratedJobs = await this.prisma.job.findMany({
                    where: {
                        workspaceId,
                        recurringTemplateId: serverTemplate.id,
                        scheduledAt: {
                            gte: localTemplate.nextRunDate,
                            lt: serverTemplate.nextRunDate,
                        },
                    },
                });
                for (const serverJob of serverGeneratedJobs) {
                    const localExists = await this.prisma.job.findFirst({
                        where: {
                            workspaceId,
                            id: serverJob.id,
                        },
                    });
                    if (!localExists) {
                        regeneratedJobs.push(serverJob);
                    }
                }
            }
        }
        else if (localTemplate.syncVersion > serverTemplate.syncVersion) {
            resolvedTemplate = await this.prisma.recurringJobTemplate.update({
                where: {
                    id: localTemplate.id,
                    workspaceId,
                },
                data: {
                    title: localTemplate.title,
                    description: localTemplate.description,
                    priority: localTemplate.priority,
                    frequency: localTemplate.frequency,
                    interval: localTemplate.interval,
                    dayOfWeek: localTemplate.dayOfWeek,
                    dayOfMonth: localTemplate.dayOfMonth,
                    startDate: localTemplate.startDate,
                    endDate: localTemplate.endDate,
                    estimatedDuration: localTemplate.estimatedDuration,
                    location: localTemplate.location === null ? client_1.Prisma.JsonNull : localTemplate.location,
                    isActive: localTemplate.isActive,
                    nextRunDate: serverTemplate.nextRunDate > localTemplate.nextRunDate
                        ? serverTemplate.nextRunDate
                        : localTemplate.nextRunDate,
                    syncVersion: Math.max(localTemplate.syncVersion, serverTemplate.syncVersion) + 1,
                    syncStatus: client_1.SyncStatus.PENDING,
                },
            });
            const serverJobs = await this.prisma.job.findMany({
                where: {
                    workspaceId,
                    recurringTemplateId: serverTemplate.id,
                    scheduledAt: {
                        gte: localTemplate.nextRunDate,
                    },
                },
            });
            for (const serverJob of serverJobs) {
                const exists = await this.canGenerateJobForDate(serverTemplate.id, new Date(serverJob.scheduledAt));
                if (!exists && serverJob.scheduledAt) {
                    regeneratedJobs.push(serverJob);
                }
            }
        }
        else {
            resolvedTemplate = serverTemplate;
            if (serverTemplate.nextRunDate !== localTemplate.nextRunDate) {
                const moreAdvanced = serverTemplate.nextRunDate > localTemplate.nextRunDate
                    ? serverTemplate.nextRunDate
                    : localTemplate.nextRunDate;
                resolvedTemplate = await this.prisma.recurringJobTemplate.update({
                    where: {
                        id: serverTemplate.id,
                        workspaceId,
                    },
                    data: {
                        nextRunDate: moreAdvanced,
                        syncVersion: serverTemplate.syncVersion + 1,
                        syncStatus: client_1.SyncStatus.PENDING,
                    },
                });
                const earlierDate = serverTemplate.nextRunDate < localTemplate.nextRunDate
                    ? serverTemplate.nextRunDate
                    : localTemplate.nextRunDate;
                const laterDate = serverTemplate.nextRunDate > localTemplate.nextRunDate
                    ? serverTemplate.nextRunDate
                    : localTemplate.nextRunDate;
                const missingJobs = await this.prisma.job.findMany({
                    where: {
                        workspaceId,
                        recurringTemplateId: serverTemplate.id,
                        scheduledAt: {
                            gte: earlierDate,
                            lt: laterDate,
                        },
                    },
                });
                regeneratedJobs.push(...missingJobs);
            }
        }
        return {
            resolvedTemplate,
            regeneratedJobs,
        };
    }
    async generateRecurringJobs(workspaceId) {
        const targetWorkspaceId = workspaceId || this.getWorkspaceIdOrThrow();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const templates = await this.prisma.recurringJobTemplate.findMany({
            where: {
                workspaceId: targetWorkspaceId,
                isActive: true,
                nextRunDate: {
                    lte: today,
                },
            },
        });
        let generated = 0;
        let skipped = 0;
        const errors = [];
        for (const template of templates) {
            try {
                if (template.endDate && template.nextRunDate > template.endDate) {
                    await this.prisma.recurringJobTemplate.update({
                        where: {
                            id: template.id,
                            workspaceId: targetWorkspaceId,
                        },
                        data: { isActive: false },
                    });
                    skipped++;
                    continue;
                }
                const targetDate = new Date(template.nextRunDate);
                targetDate.setHours(9, 0, 0, 0);
                const existing = await this.canGenerateJobForDate(template.id, targetDate);
                if (!existing) {
                    skipped++;
                    const nextRunDate = this.calculateNextRunDate(template, targetDate);
                    await this.prisma.recurringJobTemplate.update({
                        where: {
                            id: template.id,
                            workspaceId: targetWorkspaceId,
                        },
                        data: {
                            nextRunDate,
                            syncVersion: template.syncVersion + 1,
                        },
                    });
                    continue;
                }
                await this.generateJobFromTemplate(template.id, targetDate);
                generated++;
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push({
                    templateId: template.id,
                    error: errorMessage,
                });
            }
        }
        return {
            generated,
            skipped,
            errors,
        };
    }
};
exports.RecurrenceService = RecurrenceService;
exports.RecurrenceService = RecurrenceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function])
], RecurrenceService);

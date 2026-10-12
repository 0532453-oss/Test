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
exports.JobService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const geofenceValidator_1 = require("./utils/geofenceValidator");
const jobStatusMachine_1 = require("./utils/jobStatusMachine");
const base_service_1 = require("../../engine/base.service");
let JobService = class JobService extends base_service_1.BaseService {
    constructor(prisma, billingService, notificationService) {
        super(prisma, prisma.job, 'Job');
        this.billingService = billingService;
        this.notificationService = notificationService;
    }
    async createJob(dto) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        let scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : undefined;
        if (dto.scheduledDate && !scheduledAt) {
            const time = dto.scheduledStartTime || '00:00';
            scheduledAt = new Date(`${dto.scheduledDate}T${time}:00`);
        }
        const data = {
            workspace: { connect: { id: workspaceId } },
            customer: { connect: { id: dto.customerId } },
            title: dto.title,
            description: dto.description,
            priority: dto.priority || client_1.JobPriority.MEDIUM,
            status: client_1.JobStatus.SCHEDULED,
            scheduledAt,
            scheduledDate: dto.scheduledDate,
            scheduledStartTime: dto.scheduledStartTime,
            scheduledEndTime: dto.scheduledEndTime,
            estimatedDuration: dto.estimatedDuration,
            location: dto.location,
            syncStatus: client_1.SyncStatus.PENDING,
            syncVersion: 0,
        };
        const techId = dto.technicianId || dto.assignedTechnicianId;
        if (techId) {
            data.technician = { connect: { id: techId } };
        }
        const job = await this.create({ data });
        return job;
    }
    async findAllJobs(filters = {}) {
        const where = {};
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.customerId) {
            where.customerId = filters.customerId;
        }
        if (filters.technicianId) {
            where.technicianId = filters.technicianId;
        }
        const jobs = await this.findMany({
            where,
            include: {
                customer: true,
                technician: { include: { user: true } },
            },
            orderBy: { scheduledAt: 'asc' },
        });
        return jobs;
    }
    async findJobsByDateRange(startDate, endDate) {
        const startDateStr = startDate.toISOString().slice(0, 10);
        const endDateStr = endDate.toISOString().slice(0, 10);
        const jobs = await this.findMany({
            where: {
                OR: [
                    {
                        scheduledAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    {
                        scheduledDate: {
                            gte: startDateStr,
                            lte: endDateStr,
                        },
                        scheduledAt: null,
                    },
                ],
            },
            include: {
                customer: true,
                technician: { include: { user: true } },
            },
            orderBy: { scheduledAt: 'asc' },
        });
        return jobs;
    }
    async getJobWithDetails(id) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const job = await this.prisma.job.findFirst({
            where: { id, workspaceId },
            include: {
                customer: true,
                technician: { include: { user: true } },
                invoice: { include: { lineItems: true } },
                jobNotes: true,
                jobAttachments: true,
                recurringTemplate: true,
            },
        });
        if (!job) {
            throw new common_1.NotFoundException('Job not found');
        }
        return job;
    }
    async updateJob(id, dto) {
        const existing = await this.getJobById(id);
        let scheduledAt;
        if (dto.scheduledAt) {
            scheduledAt = new Date(dto.scheduledAt);
        }
        else if (dto.scheduledDate) {
            const time = dto.scheduledStartTime || '00:00';
            scheduledAt = new Date(`${dto.scheduledDate}T${time}:00`);
        }
        const data = {
            ...(dto.title && { title: dto.title }),
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.priority && { priority: dto.priority }),
            ...(dto.status && { status: dto.status }),
            ...(scheduledAt && { scheduledAt }),
            ...(dto.scheduledDate !== undefined && { scheduledDate: dto.scheduledDate }),
            ...(dto.scheduledStartTime !== undefined && { scheduledStartTime: dto.scheduledStartTime }),
            ...(dto.scheduledEndTime !== undefined && { scheduledEndTime: dto.scheduledEndTime }),
            ...(dto.estimatedDuration !== undefined && {
                estimatedDuration: dto.estimatedDuration,
            }),
            ...(dto.location !== undefined && {
                location: dto.location === null ? client_1.Prisma.JsonNull : dto.location,
            }),
            syncStatus: client_1.SyncStatus.PENDING,
            syncVersion: existing.syncVersion + 1,
        };
        const techId = dto.technicianId || dto.assignedTechnicianId;
        if (techId) {
            data.technician = { connect: { id: techId } };
        }
        const job = await this.update({
            where: { id },
            data,
        });
        return job;
    }
    async assignTechnician(jobId, technicianId) {
        const existing = await this.getJobById(jobId);
        const job = await this.update({
            where: { id: jobId },
            data: {
                technician: { connect: { id: technicianId } },
                syncStatus: client_1.SyncStatus.PENDING,
                syncVersion: existing.syncVersion + 1,
            },
        });
        return job;
    }
    async deleteJob(id) {
        await this.getJobById(id);
        const job = await this.delete({ where: { id } });
        return job;
    }
    async findTechnicianJobsForDate(userId, date) {
        const technician = await this.prisma.technician.findFirst({
            where: { userId },
        });
        if (!technician) {
            throw new common_1.NotFoundException('Technician not found for current user');
        }
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const jobs = await this.findMany({
            where: {
                technicianId: technician.id,
                OR: [
                    {
                        scheduledAt: {
                            gte: startOfDay,
                            lte: endOfDay,
                        },
                    },
                    {
                        scheduledDate: dateStr,
                        scheduledAt: null,
                    },
                ],
            },
        });
        return jobs;
    }
    async getJobById(id) {
        const job = await this.findUniqueOrThrow({ where: { id } });
        return job;
    }
    async transitionStatus(jobId, nextStatus) {
        const job = await this.getJobById(jobId);
        const currentStatus = job.status;
        if (!(0, jobStatusMachine_1.isValidTransition)(currentStatus, nextStatus)) {
            throw new common_1.BadRequestException(`Invalid status transition from ${currentStatus} to ${nextStatus}`);
        }
        if ((0, jobStatusMachine_1.requiresGeofence)(currentStatus, nextStatus)) {
            if (!job.technicianId) {
                throw new common_1.BadRequestException('Technician is required to start job');
            }
            const technician = await this.prisma.technician.findUnique({
                where: { id: job.technicianId },
            });
            if (!technician) {
                throw new common_1.NotFoundException('Technician not found');
            }
            const jobLocation = (job.location ?? null);
            const technicianLocation = (technician.currentLocation ?? null);
            if (!(0, geofenceValidator_1.isValidLocation)(jobLocation) || !(0, geofenceValidator_1.isValidLocation)(technicianLocation)) {
                throw new common_1.ForbiddenException('Valid job and technician locations are required for this transition');
            }
            const result = await (0, geofenceValidator_1.validateJobGeofence)({ lat: jobLocation.lat, lng: jobLocation.lng }, { lat: technicianLocation.lat, lng: technicianLocation.lng });
            if (!result.valid) {
                throw new geofenceValidator_1.GeofenceError(result.distance, 500, result.message);
            }
        }
        const now = new Date();
        const data = {
            status: nextStatus,
            syncStatus: client_1.SyncStatus.PENDING,
            syncVersion: job.syncVersion + 1,
        };
        if (nextStatus === client_1.JobStatus.IN_PROGRESS && !job.startedAt) {
            data.startedAt = now;
        }
        if (nextStatus === client_1.JobStatus.COMPLETED && !job.completedAt) {
            data.completedAt = now;
        }
        const updatedJob = await this.update({
            where: { id: jobId },
            data,
        });
        if (nextStatus === client_1.JobStatus.DISPATCHED) {
            this.notificationService.logJobDispatched(updatedJob, {
                previousStatus: currentStatus,
            });
        }
        if (nextStatus === client_1.JobStatus.COMPLETED) {
            const invoice = await this.billingService.createInvoiceFromJob(jobId);
            this.notificationService.logJobCompleted(updatedJob, {
                previousStatus: currentStatus,
                invoice,
            });
        }
        return updatedJob;
    }
};
exports.JobService = JobService;
exports.JobService = JobService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function, Function, Function])
], JobService);

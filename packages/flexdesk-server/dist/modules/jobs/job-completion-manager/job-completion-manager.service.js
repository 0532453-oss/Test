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
exports.JobCompletionManagerService = void 0;
const common_1 = require("@nestjs/common");
const geofenceValidator_1 = require("../utils/geofenceValidator");
let JobCompletionManagerService = class JobCompletionManagerService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async startJob(params) {
        const { jobId, workspaceId, technicianLocation } = params;
        let geofenceWarning;
        if (technicianLocation) {
            const geofenceResult = await this.validateGeofence({
                jobId,
                technicianLocation,
                workspaceId,
            });
            if (!geofenceResult.isValid) {
                geofenceWarning = geofenceResult.warning;
            }
        }
        const job = await this.prisma.job.update({
            where: { id: jobId, workspaceId },
            data: {
                status: 'IN_PROGRESS',
                startedAt: new Date(),
            },
        });
        return { ...job, geofenceWarning };
    }
    async completeJob(params) {
        const { jobId, workspaceId, userId, completionData, technicianLocation } = params;
        let geofenceWarning;
        if (technicianLocation) {
            const geofenceResult = await this.validateGeofence({
                jobId,
                technicianLocation,
                workspaceId,
            });
            if (!geofenceResult.isValid) {
                geofenceWarning = geofenceResult.warning;
            }
        }
        const job = await this.prisma.job.update({
            where: { id: jobId, workspaceId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
            },
            include: {
                customer: true,
            },
        });
        if (completionData.notes) {
            await this.prisma.jobNote.create({
                data: {
                    jobId,
                    userId,
                    content: completionData.notes,
                    isInternal: false,
                },
            });
        }
        return { ...job, geofenceWarning };
    }
    async putJobOnHold(params) {
        const { jobId, workspaceId, userId, reason, followUpDate } = params;
        const job = await this.prisma.job.update({
            where: { id: jobId, workspaceId },
            data: {
                status: 'ON_HOLD',
            },
        });
        if (reason) {
            await this.prisma.jobNote.create({
                data: {
                    jobId,
                    userId,
                    content: `Job put on hold: ${reason}`,
                    isInternal: true,
                },
            });
        }
        return job;
    }
    async cancelJob(params) {
        const { jobId, workspaceId, reason, cancelledBy } = params;
        const job = await this.prisma.job.update({
            where: { id: jobId, workspaceId },
            data: {
                status: 'CANCELLED',
            },
        });
        if (reason) {
            await this.prisma.jobNote.create({
                data: {
                    jobId,
                    userId: cancelledBy,
                    content: `Job cancelled: ${reason}`,
                    isInternal: true,
                },
            });
        }
        return job;
    }
    async validateGeofence(params) {
        const { jobId, technicianLocation, workspaceId, radiusMeters = 200 } = params;
        const job = await this.prisma.job.findUnique({
            where: { id: jobId, workspaceId },
            include: { property: true },
        });
        let jobLocation = null;
        if (job?.property?.lat != null && job?.property?.lng != null) {
            jobLocation = { lat: job.property.lat, lng: job.property.lng };
        }
        else if (job?.location) {
            const loc = job.location;
            if (loc.lat != null && loc.lng != null) {
                jobLocation = { lat: loc.lat, lng: loc.lng };
            }
        }
        if (!jobLocation) {
            return { isValid: true };
        }
        const distance = (0, geofenceValidator_1.calculateDistance)(jobLocation, technicianLocation);
        const isValid = distance <= radiusMeters;
        return {
            isValid,
            distance,
            warning: isValid
                ? undefined
                : `Technician is ${distance}m away from the job site (radius: ${radiusMeters}m)`,
        };
    }
    async getCompletionSummary(params) {
        const { jobId, workspaceId } = params;
        return this.prisma.job.findUnique({
            where: { id: jobId, workspaceId },
            include: {
                customer: true,
                technician: true,
                property: true,
                invoice: true,
            },
        });
    }
};
exports.JobCompletionManagerService = JobCompletionManagerService;
exports.JobCompletionManagerService = JobCompletionManagerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function])
], JobCompletionManagerService);

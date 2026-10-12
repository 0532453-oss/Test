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
exports.TechnicianService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const base_service_1 = require("../../engine/base.service");
let TechnicianService = class TechnicianService extends base_service_1.BaseService {
    constructor(prisma, googleMapsService) {
        super(prisma, prisma.technician, 'Technician');
        this.googleMapsService = googleMapsService;
    }
    async createTechnician(dto) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const existingByUser = await this.prisma.technician.findFirst({
            where: { userId: dto.userId },
        });
        if (existingByUser) {
            throw new common_1.ConflictException('User is already a technician');
        }
        const data = {
            workspace: { connect: { id: workspaceId } },
            user: { connect: { id: dto.userId } },
            phone: dto.phone,
            licenseNumber: dto.licenseNumber,
            specialties: dto.specialties || [],
            isAvailable: true,
            syncStatus: client_1.SyncStatus.PENDING,
            syncVersion: 0,
        };
        const technician = await this.create({ data });
        return technician;
    }
    async findAllTechnicians() {
        const technicians = await this.findMany({
            include: { user: true },
            orderBy: { createdAt: 'desc' },
        });
        return technicians;
    }
    async findTechnicianById(id) {
        const technician = await this.findUniqueOrThrow({
            where: { id },
            include: { user: true },
        });
        return technician;
    }
    async findTechnicianByUserId(userId) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const technician = await this.prisma.technician.findFirst({
            where: { userId, workspaceId },
            include: { user: true },
        });
        if (!technician) {
            throw new common_1.NotFoundException('Technician not found for current user');
        }
        return technician;
    }
    async findAvailableTechnicians(available) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const technicians = await this.prisma.technician.findMany({
            where: { workspaceId, isAvailable: available },
            include: { user: true },
            orderBy: { createdAt: 'desc' },
        });
        return technicians;
    }
    async updateTechnician(id, dto) {
        const existing = await this.findTechnicianById(id);
        const data = {
            ...(dto.phone !== undefined && { phone: dto.phone }),
            ...(dto.licenseNumber !== undefined && { licenseNumber: dto.licenseNumber }),
            ...(dto.specialties !== undefined && { specialties: dto.specialties }),
            ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
            syncStatus: client_1.SyncStatus.PENDING,
            syncVersion: existing.syncVersion + 1,
        };
        const technician = await this.update({
            where: { id },
            data,
        });
        return technician;
    }
    async updateCurrentLocation(userId, location) {
        const technician = await this.findTechnicianByUserId(userId);
        const data = {
            currentLocation: {
                lat: location.lat,
                lng: location.lng,
                updatedAt: new Date().toISOString(),
            },
            syncStatus: client_1.SyncStatus.PENDING,
            syncVersion: technician.syncVersion + 1,
        };
        await this.update({
            where: { id: technician.id },
            data,
        });
    }
    async setAvailability(id, isAvailable) {
        const existing = await this.findTechnicianById(id);
        const technician = await this.update({
            where: { id },
            data: {
                isAvailable,
                syncStatus: client_1.SyncStatus.PENDING,
                syncVersion: existing.syncVersion + 1,
            },
        });
        return technician;
    }
    async getNextJob(technicianId) {
        const technician = await this.findTechnicianById(technicianId);
        const now = new Date();
        const inProgressJob = await this.prisma.job.findFirst({
            where: {
                technicianId: technician.id,
                status: client_1.JobStatus.IN_PROGRESS,
            },
            include: { customer: true },
        });
        const nextJob = await this.prisma.job.findFirst({
            where: {
                technicianId: technician.id,
                status: {
                    in: [client_1.JobStatus.SCHEDULED, client_1.JobStatus.DISPATCHED],
                },
                scheduledAt: {
                    gte: now,
                },
            },
            include: { customer: true },
            orderBy: { scheduledAt: 'asc' },
        });
        const fallbackJob = nextJob ??
            (await this.prisma.job.findFirst({
                where: {
                    technicianId: technician.id,
                    status: {
                        in: [client_1.JobStatus.SCHEDULED, client_1.JobStatus.DISPATCHED],
                    },
                    scheduledAt: {
                        gte: new Date(now.toDateString()),
                        lt: new Date(new Date(now.toDateString()).getTime() + 24 * 60 * 60 * 1000),
                    },
                },
                include: { customer: true },
                orderBy: { scheduledAt: 'asc' },
            }));
        const targetJob = nextJob ?? fallbackJob;
        if (!targetJob) {
            return {
                hasNextJob: false,
                message: 'No upcoming jobs scheduled',
                hasJobInProgress: !!inProgressJob,
                inProgressJobId: inProgressJob?.id,
            };
        }
        let jobLocation = targetJob.location;
        const technicianLocation = technician.currentLocation;
        if (jobLocation?.address &&
            (jobLocation.lat === undefined ||
                jobLocation.lng === undefined ||
                isNaN(jobLocation.lat) ||
                isNaN(jobLocation.lng))) {
            try {
                const geocoded = await this.googleMapsService.geocodeAddress(jobLocation.address);
                if (geocoded) {
                    jobLocation = {
                        ...jobLocation,
                        lat: geocoded.lat,
                        lng: geocoded.lng,
                    };
                }
            }
            catch {
            }
        }
        const scheduledTime = targetJob.scheduledAt
            ? new Date(targetJob.scheduledAt)
            : now;
        const minutesUntilStart = Math.round((scheduledTime.getTime() - now.getTime()) / (1000 * 60));
        let directionsUrl = '';
        if (jobLocation?.lat && jobLocation?.lng) {
            directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${jobLocation.lat},${jobLocation.lng}&travelmode=driving`;
        }
        let travelTimeMinutes;
        let travelDistanceMeters;
        if (technicianLocation?.lat &&
            technicianLocation?.lng &&
            jobLocation?.lat &&
            jobLocation?.lng) {
            try {
                const distanceResult = await this.googleMapsService.getDistanceMatrix({ lat: technicianLocation.lat, lng: technicianLocation.lng }, { lat: jobLocation.lat, lng: jobLocation.lng });
                travelTimeMinutes = distanceResult?.durationMinutes;
                travelDistanceMeters = distanceResult?.distanceMeters;
            }
            catch {
            }
        }
        return {
            jobId: targetJob.id,
            customerName: targetJob.customer?.name ?? 'Unknown Customer',
            title: targetJob.title,
            address: jobLocation?.address,
            lat: jobLocation?.lat,
            lng: jobLocation?.lng,
            scheduledAt: targetJob.scheduledAt?.toISOString() ?? now.toISOString(),
            travelTimeMinutes,
            travelDistanceMeters,
            minutesUntilStart,
            directionsUrl,
            hasJobInProgress: !!inProgressJob,
            inProgressJobId: inProgressJob?.id,
        };
    }
};
exports.TechnicianService = TechnicianService;
exports.TechnicianService = TechnicianService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function, Function])
], TechnicianService);

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
exports.JobSchedulingManagerService = void 0;
const common_1 = require("@nestjs/common");
const geofenceValidator_1 = require("../utils/geofenceValidator");
let JobSchedulingManagerService = class JobSchedulingManagerService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async scheduleJob(params) {
        const { jobId, scheduledDate, scheduledStartTime, technicianId, workspaceId } = params;
        const scheduledAt = new Date(`${scheduledDate}T${scheduledStartTime}:00`);
        return this.prisma.job.update({
            where: { id: jobId, workspaceId },
            data: {
                scheduledDate,
                scheduledStartTime,
                scheduledAt,
                technicianId,
                status: 'SCHEDULED',
            },
        });
    }
    async rescheduleJob(params) {
        const { jobId, newDate, newStartTime, workspaceId, reason } = params;
        const scheduledAt = new Date(`${newDate}T${newStartTime}:00`);
        return this.prisma.job.update({
            where: { id: jobId, workspaceId },
            data: {
                scheduledDate: newDate,
                scheduledStartTime: newStartTime,
                scheduledAt,
            },
        });
    }
    async getAvailableSlots(params) {
        const { technicianId, date, workspaceId } = params;
        const dayStartMinutes = 8 * 60;
        const dayEndMinutes = 18 * 60;
        if (technicianId) {
            return this.getSlotsForTechnician(technicianId, date, workspaceId, dayStartMinutes, dayEndMinutes);
        }
        const technicians = await this.prisma.technician.findMany({
            where: { workspaceId, isAvailable: true },
            select: { id: true },
        });
        const allSlots = [];
        for (const tech of technicians) {
            const slots = await this.getSlotsForTechnician(tech.id, date, workspaceId, dayStartMinutes, dayEndMinutes);
            allSlots.push(...slots);
        }
        return allSlots;
    }
    async getSlotsForTechnician(technicianId, date, workspaceId, dayStartMinutes, dayEndMinutes) {
        const existingJobs = await this.prisma.job.findMany({
            where: {
                technicianId,
                workspaceId,
                scheduledDate: date,
                status: { notIn: ['CANCELLED', 'COMPLETED'] },
            },
            select: {
                scheduledStartTime: true,
                scheduledEndTime: true,
                estimatedDuration: true,
            },
            orderBy: { scheduledStartTime: 'asc' },
        });
        const occupied = existingJobs
            .filter((j) => j.scheduledStartTime)
            .map((j) => {
            const start = this.toMinutes(j.scheduledStartTime);
            const end = j.scheduledEndTime
                ? this.toMinutes(j.scheduledEndTime)
                : start + (j.estimatedDuration ?? 60);
            return { start, end };
        })
            .sort((a, b) => a.start - b.start);
        const slots = [];
        let cursor = dayStartMinutes;
        for (const interval of occupied) {
            if (cursor < interval.start) {
                slots.push({
                    startTime: this.fromMinutes(cursor),
                    endTime: this.fromMinutes(interval.start),
                    technicianId,
                });
            }
            cursor = Math.max(cursor, interval.end);
        }
        if (cursor < dayEndMinutes) {
            slots.push({
                startTime: this.fromMinutes(cursor),
                endTime: this.fromMinutes(dayEndMinutes),
                technicianId,
            });
        }
        return slots;
    }
    toMinutes(time) {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    }
    fromMinutes(minutes) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    async suggestTechnician(params) {
        const { jobId, requiredSkills, workspaceId } = params;
        const job = await this.prisma.job.findUnique({
            where: { id: jobId, workspaceId },
            select: {
                scheduledDate: true,
                scheduledStartTime: true,
                scheduledEndTime: true,
                location: true,
                property: { select: { lat: true, lng: true } },
            },
        });
        if (!job)
            return [];
        let jobLocation = null;
        if (job.property?.lat != null && job.property?.lng != null) {
            jobLocation = { lat: job.property.lat, lng: job.property.lng };
        }
        else if (job.location && typeof job.location === 'object') {
            const loc = job.location;
            if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
                jobLocation = { lat: loc.lat, lng: loc.lng };
            }
        }
        const technicians = await this.prisma.technician.findMany({
            where: {
                workspaceId,
                isAvailable: true,
                ...(requiredSkills?.length
                    ? { specialties: { hasSome: requiredSkills } }
                    : {}),
            },
            include: {
                user: true,
            },
        });
        if (technicians.length === 0)
            return [];
        const activeJobCounts = await this.prisma.job.groupBy({
            by: ['technicianId'],
            where: {
                workspaceId,
                technicianId: { in: technicians.map((t) => t.id) },
                status: { in: ['SCHEDULED', 'DISPATCHED', 'IN_PROGRESS'] },
            },
            _count: { id: true },
        });
        const countMap = new Map(activeJobCounts.map((c) => [c.technicianId, c._count.id]));
        let conflictingTechIds = new Set();
        if (job.scheduledDate && job.scheduledStartTime) {
            const conflictingJobs = await this.prisma.job.findMany({
                where: {
                    workspaceId,
                    technicianId: { in: technicians.map((t) => t.id) },
                    scheduledDate: job.scheduledDate,
                    status: { notIn: ['CANCELLED', 'COMPLETED'] },
                },
                select: {
                    technicianId: true,
                    scheduledStartTime: true,
                    scheduledEndTime: true,
                    estimatedDuration: true,
                },
            });
            for (const cj of conflictingJobs) {
                if (!cj.technicianId || !cj.scheduledStartTime)
                    continue;
                if (this.timeSlotsOverlap(job.scheduledStartTime, job.scheduledEndTime, cj.scheduledStartTime, cj.scheduledEndTime, cj.estimatedDuration)) {
                    conflictingTechIds.add(cj.technicianId);
                }
            }
        }
        const maxJobs = Math.max(1, ...technicians.map((t) => countMap.get(t.id) ?? 0));
        const scored = technicians.map((tech) => {
            let score = 0;
            const activeJobCount = countMap.get(tech.id) ?? 0;
            if (!conflictingTechIds.has(tech.id)) {
                score += 40;
            }
            let distanceMeters = null;
            if (jobLocation && tech.currentLocation && typeof tech.currentLocation === 'object') {
                const loc = tech.currentLocation;
                if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
                    distanceMeters = (0, geofenceValidator_1.calculateDistance)(jobLocation, { lat: loc.lat, lng: loc.lng });
                    const maxDist = 50000;
                    const proximityRatio = Math.max(0, 1 - distanceMeters / maxDist);
                    score += Math.round(proximityRatio * 30);
                }
            }
            const workloadRatio = 1 - activeJobCount / maxJobs;
            score += Math.round(workloadRatio * 30);
            return {
                technicianId: tech.id,
                technicianName: [tech.user?.firstName, tech.user?.lastName].filter(Boolean).join(' ') || 'Unknown',
                score,
                activeJobCount,
                distanceMeters,
            };
        });
        scored.sort((a, b) => b.score - a.score);
        return scored;
    }
    async autoAssignTechnician(params) {
        const suggestions = await this.suggestTechnician(params);
        if (suggestions.length === 0)
            return null;
        return suggestions[0];
    }
    timeSlotsOverlap(start1, end1, start2, end2, estimatedDuration2) {
        const s1 = this.toMinutes(start1);
        const e1 = end1 ? this.toMinutes(end1) : s1 + 60;
        const s2 = this.toMinutes(start2);
        const e2 = end2 ? this.toMinutes(end2) : s2 + (estimatedDuration2 ?? 60);
        return s1 < e2 && s2 < e1;
    }
};
exports.JobSchedulingManagerService = JobSchedulingManagerService;
exports.JobSchedulingManagerService = JobSchedulingManagerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function])
], JobSchedulingManagerService);

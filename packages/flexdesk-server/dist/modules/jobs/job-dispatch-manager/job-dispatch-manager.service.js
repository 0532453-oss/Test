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
exports.JobDispatchManagerService = void 0;
const common_1 = require("@nestjs/common");
let JobDispatchManagerService = class JobDispatchManagerService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async dispatchJob(params) {
        const { jobId, technicianId, workspaceId, notifyTechnician = true } = params;
        const job = await this.prisma.job.update({
            where: { id: jobId, workspaceId },
            data: {
                technicianId,
                status: 'DISPATCHED',
            },
            include: {
                customer: true,
                property: true,
            },
        });
        if (notifyTechnician) {
        }
        return job;
    }
    async bulkDispatch(params) {
        const { assignments, workspaceId } = params;
        const results = await Promise.all(assignments.map((assignment) => this.dispatchJob({
            ...assignment,
            workspaceId,
            notifyTechnician: true,
        })));
        return results;
    }
    async getDispatchBoard(params) {
        const { date, workspaceId } = params;
        const dateString = date.toISOString().split('T')[0];
        const [jobs, technicians] = await Promise.all([
            this.prisma.job.findMany({
                where: {
                    workspaceId,
                    scheduledDate: dateString,
                },
                include: {
                    customer: true,
                    technician: true,
                    property: true,
                },
                orderBy: { scheduledStartTime: 'asc' },
            }),
            this.prisma.technician.findMany({
                where: { workspaceId, isAvailable: true },
            }),
        ]);
        return { jobs, technicians, date };
    }
    async reassignJob(params) {
        const { jobId, newTechnicianId, workspaceId, reason } = params;
        return this.prisma.job.update({
            where: { id: jobId, workspaceId },
            data: {
                technicianId: newTechnicianId,
            },
        });
    }
    async optimizeRoute(params) {
        return null;
    }
};
exports.JobDispatchManagerService = JobDispatchManagerService;
exports.JobDispatchManagerService = JobDispatchManagerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function])
], JobDispatchManagerService);

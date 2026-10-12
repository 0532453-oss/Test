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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicTrackingController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../../auth/decorators/public.decorator");
const crypto_1 = require("../../../utils/crypto");
let PublicTrackingController = class PublicTrackingController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async trackJob(token) {
        if (!token) {
            throw new common_1.BadRequestException('Missing tracking token');
        }
        const payload = (0, crypto_1.verifyJobToken)(token);
        if (!payload) {
            throw new common_1.UnauthorizedException('Invalid or expired tracking token');
        }
        const job = await this.prisma.job.findFirst({
            where: {
                id: payload.jobId,
                workspaceId: payload.workspaceId,
            },
        });
        if (!job || !job.technicianId) {
            return {
                job,
                technician: null,
            };
        }
        const technician = await this.prisma.technician.findFirst({
            where: {
                id: job.technicianId,
                workspaceId: payload.workspaceId,
            },
            include: {
                user: true,
            },
        });
        if (!technician) {
            return {
                job,
                technician: null,
            };
        }
        const technicianInfo = {
            id: technician.id,
            name: technician.user?.firstName || technician.user?.lastName
                ? `${technician.user?.firstName ?? ''} ${technician.user?.lastName ?? ''}`.trim()
                : 'Technician',
            currentLocation: technician.currentLocation,
        };
        return {
            job,
            technician: technicianInfo,
        };
    }
};
exports.PublicTrackingController = PublicTrackingController;
__decorate([
    (0, common_1.Get)('track'),
    __param(0, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicTrackingController.prototype, "trackJob", null);
exports.PublicTrackingController = PublicTrackingController = __decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Controller)('public'),
    __metadata("design:paramtypes", [Function])
], PublicTrackingController);

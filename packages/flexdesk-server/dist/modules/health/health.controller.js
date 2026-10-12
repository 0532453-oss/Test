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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../auth/decorators/public.decorator");
let HealthController = class HealthController {
    constructor(healthService) {
        this.healthService = healthService;
    }
    async check(res) {
        const db = await this.healthService.checkDatabase();
        const timestamp = new Date().toISOString();
        if (db.status === 'up') {
            return res.status(common_1.HttpStatus.OK).json({
                status: 'ok',
                database: 'connected',
                timestamp,
            });
        }
        return res.status(common_1.HttpStatus.SERVICE_UNAVAILABLE).json({
            status: 'degraded',
            database: 'disconnected',
            timestamp,
        });
    }
    async details() {
        return this.healthService.getFullHealth();
    }
    async ready(res) {
        const health = await this.healthService.getFullHealth();
        if (health.status === 'unhealthy') {
            return res.status(common_1.HttpStatus.SERVICE_UNAVAILABLE).json({
                status: 'not_ready',
                reason: 'Database is unreachable',
            });
        }
        return res.status(common_1.HttpStatus.OK).json({ status: 'ready' });
    }
    live() {
        return { status: 'alive' };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Health check with database connectivity' }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
__decorate([
    (0, common_1.Get)('details'),
    (0, swagger_1.ApiOperation)({ summary: 'Detailed health check with DB and service status (requires auth)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "details", null);
__decorate([
    (0, common_1.Get)('ready'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Readiness probe — returns 503 if DB is down' }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "ready", null);
__decorate([
    (0, common_1.Get)('live'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Liveness probe — always returns 200 if process is running' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "live", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('Health'),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [Function])
], HealthController);

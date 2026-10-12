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
exports.RouteOptimizationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let RouteOptimizationController = class RouteOptimizationController {
    constructor(routeOptimizationService) {
        this.routeOptimizationService = routeOptimizationService;
    }
    getStatus() {
        return {
            googleMapsConfigured: this.routeOptimizationService.isGoogleMapsConfigured(),
            fallbackMethod: 'nearest_neighbor',
        };
    }
    async optimizeRoute(dto) {
        const origin = {
            id: dto.origin.id,
            location: dto.origin.location,
            name: dto.origin.name,
            address: dto.origin.address,
            estimatedDurationMinutes: dto.origin.estimatedDurationMinutes,
            timeWindowStart: dto.origin.timeWindowStart
                ? new Date(dto.origin.timeWindowStart)
                : undefined,
            timeWindowEnd: dto.origin.timeWindowEnd
                ? new Date(dto.origin.timeWindowEnd)
                : undefined,
        };
        const waypoints = dto.waypoints.map((wp) => ({
            id: wp.id,
            location: wp.location,
            name: wp.name,
            address: wp.address,
            estimatedDurationMinutes: wp.estimatedDurationMinutes,
            timeWindowStart: wp.timeWindowStart
                ? new Date(wp.timeWindowStart)
                : undefined,
            timeWindowEnd: wp.timeWindowEnd ? new Date(wp.timeWindowEnd) : undefined,
        }));
        const destination = dto.destination
            ? {
                id: dto.destination.id,
                location: dto.destination.location,
                name: dto.destination.name,
                address: dto.destination.address,
                estimatedDurationMinutes: dto.destination.estimatedDurationMinutes,
                timeWindowStart: dto.destination.timeWindowStart
                    ? new Date(dto.destination.timeWindowStart)
                    : undefined,
                timeWindowEnd: dto.destination.timeWindowEnd
                    ? new Date(dto.destination.timeWindowEnd)
                    : undefined,
            }
            : undefined;
        return this.routeOptimizationService.optimizeRoute(origin, waypoints, destination);
    }
    async optimizeTechnicianRoute(dto) {
        return this.routeOptimizationService.optimizeTechnicianRoute(dto.technicianId, new Date(dto.date), dto.startLocation);
    }
    async getDirections(dto) {
        return this.routeOptimizationService.getDirections(dto.origin, dto.destination);
    }
    async getDistanceMatrix(dto) {
        return this.routeOptimizationService.getDistanceMatrix(dto.origins, dto.destinations);
    }
};
exports.RouteOptimizationController = RouteOptimizationController;
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Check route optimization service status' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns whether Google Maps API is configured',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RouteOptimizationController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('optimize'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Optimize route for a list of waypoints' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns optimized route with waypoint order and distances',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], RouteOptimizationController.prototype, "optimizeRoute", null);
__decorate([
    (0, common_1.Post)('optimize-technician'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Optimize route for a technician\'s daily jobs' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns optimized route for technician\'s scheduled jobs',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], RouteOptimizationController.prototype, "optimizeTechnicianRoute", null);
__decorate([
    (0, common_1.Post)('directions'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get directions between two points' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns distance, duration, and optional polyline',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], RouteOptimizationController.prototype, "getDirections", null);
__decorate([
    (0, common_1.Post)('distance-matrix'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get distance matrix for multiple origins/destinations' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns distance matrix with all origin-destination pairs',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Promise)
], RouteOptimizationController.prototype, "getDistanceMatrix", null);
exports.RouteOptimizationController = RouteOptimizationController = __decorate([
    (0, swagger_1.ApiTags)('Route Optimization'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('routes'),
    __metadata("design:paramtypes", [Function])
], RouteOptimizationController);

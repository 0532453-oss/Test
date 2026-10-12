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
var RouteOptimizationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteOptimizationService = void 0;
const common_1 = require("@nestjs/common");
const geofenceValidator_1 = require("../jobs/utils/geofenceValidator");
const workspace_context_1 = require("../../core/database/workspace-context");
let RouteOptimizationService = RouteOptimizationService_1 = class RouteOptimizationService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(RouteOptimizationService_1.name);
        this.baseUrl = 'https://routes.googleapis.com';
        this.apiKey = this.configService.get('googleMaps.apiKey') || null;
        if (!this.apiKey) {
            this.logger.warn('Google Maps API key not configured. Route optimization will use fallback nearest-neighbor algorithm.');
        }
    }
    getWorkspaceIdOrThrow() {
        const workspaceId = (0, workspace_context_1.getWorkspaceId)();
        if (!workspaceId) {
            throw new common_1.BadRequestException('Workspace context is required');
        }
        return workspaceId;
    }
    isGoogleMapsConfigured() {
        return !!this.apiKey;
    }
    async optimizeRoute(origin, waypoints, destination) {
        if (waypoints.length === 0) {
            throw new common_1.BadRequestException('At least one waypoint is required');
        }
        if (!(0, geofenceValidator_1.isValidLocation)(origin.location)) {
            throw new common_1.BadRequestException('Invalid origin location');
        }
        for (const wp of waypoints) {
            if (!(0, geofenceValidator_1.isValidLocation)(wp.location)) {
                throw new common_1.BadRequestException(`Invalid location for waypoint ${wp.id}`);
            }
        }
        if (destination && !(0, geofenceValidator_1.isValidLocation)(destination.location)) {
            throw new common_1.BadRequestException('Invalid destination location');
        }
        if (this.apiKey) {
            try {
                return await this.optimizeWithGoogleMaps(origin, waypoints, destination);
            }
            catch (error) {
                this.logger.error(`Google Maps route optimization failed, falling back to nearest-neighbor: ${error}`);
                return this.optimizeWithNearestNeighbor(origin, waypoints, destination);
            }
        }
        return this.optimizeWithNearestNeighbor(origin, waypoints, destination);
    }
    async optimizeWithGoogleMaps(origin, waypoints, destination) {
        const url = `${this.baseUrl}/v2:computeRoutes`;
        const requestBody = {
            origin: {
                location: {
                    latLng: {
                        latitude: origin.location.lat,
                        longitude: origin.location.lng,
                    },
                },
            },
            destination: {
                location: {
                    latLng: {
                        latitude: destination?.location.lat ?? origin.location.lat,
                        longitude: destination?.location.lng ?? origin.location.lng,
                    },
                },
            },
            intermediates: waypoints.map((wp) => ({
                location: {
                    latLng: {
                        latitude: wp.location.lat,
                        longitude: wp.location.lng,
                    },
                },
            })),
            travelMode: 'DRIVE',
            optimizeWaypointOrder: true,
            routingPreference: 'TRAFFIC_AWARE',
            computeAlternativeRoutes: false,
            languageCode: 'en-US',
            units: 'METRIC',
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': this.apiKey,
                'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs,routes.optimizedIntermediateWaypointIndex',
            },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google Maps API error: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        if (!data.routes || data.routes.length === 0) {
            throw new Error('No routes returned from Google Maps API');
        }
        const route = data.routes[0];
        const optimizedOrder = route.optimizedIntermediateWaypointIndex || [];
        const waypointOrder = [origin.id];
        for (const index of optimizedOrder) {
            waypointOrder.push(waypoints[index].id);
        }
        if (destination) {
            waypointOrder.push(destination.id);
        }
        const legs = [];
        const allPoints = [
            origin,
            ...optimizedOrder.map((i) => waypoints[i]),
            ...(destination ? [destination] : []),
        ];
        if (route.legs) {
            for (let i = 0; i < route.legs.length; i++) {
                const leg = route.legs[i];
                legs.push({
                    fromWaypointId: allPoints[i].id,
                    toWaypointId: allPoints[i + 1].id,
                    distanceMeters: leg.distanceMeters,
                    durationSeconds: this.parseDuration(leg.duration),
                    polyline: undefined,
                });
            }
        }
        return {
            waypointOrder,
            legs,
            totalDistanceMeters: route.distanceMeters,
            totalDurationSeconds: this.parseDuration(route.duration),
            optimizationMethod: 'google_maps',
        };
    }
    optimizeWithNearestNeighbor(origin, waypoints, destination) {
        const unvisited = [...waypoints];
        const orderedWaypoints = [];
        let currentPoint = origin;
        while (unvisited.length > 0) {
            let nearestIndex = 0;
            let nearestDistance = Infinity;
            for (let i = 0; i < unvisited.length; i++) {
                const distance = (0, geofenceValidator_1.calculateDistance)(currentPoint.location, unvisited[i].location);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = i;
                }
            }
            const nearest = unvisited.splice(nearestIndex, 1)[0];
            orderedWaypoints.push(nearest);
            currentPoint = nearest;
        }
        const waypointOrder = [origin.id];
        for (const wp of orderedWaypoints) {
            waypointOrder.push(wp.id);
        }
        if (destination) {
            waypointOrder.push(destination.id);
        }
        const legs = [];
        const allPoints = [origin, ...orderedWaypoints, ...(destination ? [destination] : [])];
        let totalDistance = 0;
        for (let i = 0; i < allPoints.length - 1; i++) {
            const distanceMeters = (0, geofenceValidator_1.calculateDistance)(allPoints[i].location, allPoints[i + 1].location);
            const durationSeconds = Math.round((distanceMeters / 1000 / 40) * 3600);
            legs.push({
                fromWaypointId: allPoints[i].id,
                toWaypointId: allPoints[i + 1].id,
                distanceMeters,
                durationSeconds,
            });
            totalDistance += distanceMeters;
        }
        const totalDuration = legs.reduce((sum, leg) => sum + leg.durationSeconds, 0);
        return {
            waypointOrder,
            legs,
            totalDistanceMeters: totalDistance,
            totalDurationSeconds: totalDuration,
            optimizationMethod: this.apiKey ? 'nearest_neighbor' : 'haversine',
        };
    }
    async getDistanceMatrix(origins, destinations) {
        for (const origin of origins) {
            if (!(0, geofenceValidator_1.isValidLocation)(origin)) {
                throw new common_1.BadRequestException('Invalid origin location in matrix');
            }
        }
        for (const dest of destinations) {
            if (!(0, geofenceValidator_1.isValidLocation)(dest)) {
                throw new common_1.BadRequestException('Invalid destination location in matrix');
            }
        }
        if (this.apiKey) {
            try {
                return await this.getDistanceMatrixFromGoogleMaps(origins, destinations);
            }
            catch (error) {
                this.logger.error(`Google Maps distance matrix failed, using Haversine: ${error}`);
                return this.getDistanceMatrixHaversine(origins, destinations);
            }
        }
        return this.getDistanceMatrixHaversine(origins, destinations);
    }
    async getDistanceMatrixFromGoogleMaps(origins, destinations) {
        const url = `${this.baseUrl}/distanceMatrix/v2:computeRouteMatrix`;
        const requestBody = {
            origins: origins.map((loc) => ({
                waypoint: {
                    location: {
                        latLng: {
                            latitude: loc.lat,
                            longitude: loc.lng,
                        },
                    },
                },
            })),
            destinations: destinations.map((loc) => ({
                waypoint: {
                    location: {
                        latLng: {
                            latitude: loc.lat,
                            longitude: loc.lng,
                        },
                    },
                },
            })),
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_AWARE',
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': this.apiKey,
                'X-Goog-FieldMask': 'originIndex,destinationIndex,distanceMeters,duration',
            },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google Maps API error: ${response.status} - ${errorText}`);
        }
        const text = await response.text();
        const results = [];
        for (const line of text.split('\n')) {
            if (line.trim()) {
                const entry = JSON.parse(line);
                results.push({
                    originIndex: entry.originIndex,
                    destinationIndex: entry.destinationIndex,
                    distanceMeters: entry.distanceMeters,
                    durationSeconds: this.parseDuration(entry.duration),
                });
            }
        }
        return results;
    }
    getDistanceMatrixHaversine(origins, destinations) {
        const results = [];
        for (let i = 0; i < origins.length; i++) {
            for (let j = 0; j < destinations.length; j++) {
                const distanceMeters = (0, geofenceValidator_1.calculateDistance)(origins[i], destinations[j]);
                const durationSeconds = Math.round((distanceMeters / 1000 / 40) * 3600);
                results.push({
                    originIndex: i,
                    destinationIndex: j,
                    distanceMeters,
                    durationSeconds,
                });
            }
        }
        return results;
    }
    async optimizeTechnicianRoute(technicianId, date, technicianStartLocation) {
        const workspaceId = this.getWorkspaceIdOrThrow();
        const technician = await this.prisma.technician.findFirst({
            where: { id: technicianId, workspaceId },
        });
        if (!technician) {
            throw new common_1.BadRequestException('Technician not found');
        }
        let startLocation;
        if (technicianStartLocation && (0, geofenceValidator_1.isValidLocation)(technicianStartLocation)) {
            startLocation = technicianStartLocation;
        }
        else if (technician.currentLocation) {
            const loc = technician.currentLocation;
            if (loc.lat && loc.lng) {
                startLocation = { lat: loc.lat, lng: loc.lng };
            }
            else {
                throw new common_1.BadRequestException('Technician start location not available. Please provide technicianStartLocation.');
            }
        }
        else {
            throw new common_1.BadRequestException('Technician start location not available. Please provide technicianStartLocation.');
        }
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const jobs = await this.prisma.job.findMany({
            where: {
                workspaceId,
                technicianId,
                scheduledAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                status: {
                    in: ['SCHEDULED', 'DISPATCHED'],
                },
            },
            include: {
                property: true,
                customer: true,
            },
            orderBy: {
                scheduledAt: 'asc',
            },
        });
        if (jobs.length === 0) {
            throw new common_1.BadRequestException('No jobs scheduled for this technician on the given date');
        }
        const waypoints = jobs.map((job) => {
            let location = null;
            let address;
            if (job.property && job.property.lat && job.property.lng) {
                location = {
                    lat: Number(job.property.lat),
                    lng: Number(job.property.lng),
                };
                address = [
                    job.property.street,
                    job.property.city,
                    job.property.state,
                    job.property.zip,
                ]
                    .filter(Boolean)
                    .join(', ');
            }
            else if (job.location) {
                const loc = job.location;
                if (loc.lat && loc.lng) {
                    location = { lat: loc.lat, lng: loc.lng };
                    address = loc.address;
                }
            }
            if (!location) {
                throw new common_1.BadRequestException(`Job ${job.id} does not have a valid location`);
            }
            return {
                id: job.id,
                location,
                name: job.title || `Job ${job.id}`,
                address,
                estimatedDurationMinutes: job.estimatedDuration || undefined,
                timeWindowStart: job.scheduledAt || undefined,
                timeWindowEnd: job.scheduledAt && job.estimatedDuration
                    ? new Date(job.scheduledAt.getTime() + job.estimatedDuration * 60000)
                    : undefined,
            };
        });
        const origin = {
            id: 'technician_start',
            location: startLocation,
            name: 'Start Location',
        };
        return this.optimizeRoute(origin, waypoints);
    }
    parseDuration(duration) {
        if (!duration)
            return 0;
        const match = duration.match(/(\d+)s/);
        return match ? parseInt(match[1], 10) : 0;
    }
    async getDirections(origin, destination) {
        if (!(0, geofenceValidator_1.isValidLocation)(origin)) {
            throw new common_1.BadRequestException('Invalid origin location');
        }
        if (!(0, geofenceValidator_1.isValidLocation)(destination)) {
            throw new common_1.BadRequestException('Invalid destination location');
        }
        if (this.apiKey) {
            try {
                return await this.getDirectionsFromGoogleMaps(origin, destination);
            }
            catch (error) {
                this.logger.error(`Google Maps directions failed, using Haversine: ${error}`);
            }
        }
        const distanceMeters = (0, geofenceValidator_1.calculateDistance)(origin, destination);
        const durationSeconds = Math.round((distanceMeters / 1000 / 40) * 3600);
        return {
            distanceMeters,
            durationSeconds,
        };
    }
    async getDirectionsFromGoogleMaps(origin, destination) {
        const url = `${this.baseUrl}/v2:computeRoutes`;
        const requestBody = {
            origin: {
                location: {
                    latLng: {
                        latitude: origin.lat,
                        longitude: origin.lng,
                    },
                },
            },
            destination: {
                location: {
                    latLng: {
                        latitude: destination.lat,
                        longitude: destination.lng,
                    },
                },
            },
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_AWARE',
            computeAlternativeRoutes: false,
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': this.apiKey,
                'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
            },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google Maps API error: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        if (!data.routes || data.routes.length === 0) {
            throw new Error('No routes returned from Google Maps API');
        }
        const route = data.routes[0];
        return {
            distanceMeters: route.distanceMeters,
            durationSeconds: this.parseDuration(route.duration),
            polyline: route.polyline?.encodedPolyline,
        };
    }
};
exports.RouteOptimizationService = RouteOptimizationService;
exports.RouteOptimizationService = RouteOptimizationService = RouteOptimizationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function, Function])
], RouteOptimizationService);

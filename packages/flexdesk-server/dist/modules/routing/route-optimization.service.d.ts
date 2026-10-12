import { type ConfigService } from '@nestjs/config';
import { type Location } from '../jobs/utils/geofenceValidator';
import { type PrismaService } from '@/core/database/prisma.service';
export interface RouteWaypoint {
    id: string;
    location: Location;
    name?: string;
    address?: string;
    estimatedDurationMinutes?: number;
    timeWindowStart?: Date;
    timeWindowEnd?: Date;
}
export interface RouteLeg {
    fromWaypointId: string;
    toWaypointId: string;
    distanceMeters: number;
    durationSeconds: number;
    polyline?: string;
}
export interface OptimizedRoute {
    waypointOrder: string[];
    legs: RouteLeg[];
    totalDistanceMeters: number;
    totalDurationSeconds: number;
    optimizationMethod: 'google_maps' | 'nearest_neighbor' | 'haversine';
}
export interface DistanceMatrixResult {
    originIndex: number;
    destinationIndex: number;
    distanceMeters: number;
    durationSeconds: number;
}
export declare class RouteOptimizationService {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    private readonly apiKey;
    private readonly baseUrl;
    constructor(configService: ConfigService, prisma: PrismaService);
    private getWorkspaceIdOrThrow;
    isGoogleMapsConfigured(): boolean;
    optimizeRoute(origin: RouteWaypoint, waypoints: RouteWaypoint[], destination?: RouteWaypoint): Promise<OptimizedRoute>;
    private optimizeWithGoogleMaps;
    optimizeWithNearestNeighbor(origin: RouteWaypoint, waypoints: RouteWaypoint[], destination?: RouteWaypoint): OptimizedRoute;
    getDistanceMatrix(origins: Location[], destinations: Location[]): Promise<DistanceMatrixResult[]>;
    private getDistanceMatrixFromGoogleMaps;
    private getDistanceMatrixHaversine;
    optimizeTechnicianRoute(technicianId: string, date: Date, technicianStartLocation?: Location): Promise<OptimizedRoute>;
    private parseDuration;
    getDirections(origin: Location, destination: Location): Promise<{
        distanceMeters: number;
        durationSeconds: number;
        polyline?: string;
    }>;
    private getDirectionsFromGoogleMaps;
}

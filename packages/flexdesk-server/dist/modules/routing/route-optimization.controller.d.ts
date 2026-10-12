import { type OptimizeRouteDto, type OptimizeTechnicianRouteDto, type GetDirectionsDto, type DistanceMatrixDto } from './dto/optimize-route.dto';
import { type RouteOptimizationService } from './route-optimization.service';
export declare class RouteOptimizationController {
    private readonly routeOptimizationService;
    constructor(routeOptimizationService: RouteOptimizationService);
    getStatus(): {
        googleMapsConfigured: boolean;
        fallbackMethod: string;
    };
    optimizeRoute(dto: OptimizeRouteDto): Promise<import("./route-optimization.service").OptimizedRoute>;
    optimizeTechnicianRoute(dto: OptimizeTechnicianRouteDto): Promise<import("./route-optimization.service").OptimizedRoute>;
    getDirections(dto: GetDirectionsDto): Promise<{
        distanceMeters: number;
        durationSeconds: number;
        polyline?: string;
    }>;
    getDistanceMatrix(dto: DistanceMatrixDto): Promise<import("./route-optimization.service").DistanceMatrixResult[]>;
}

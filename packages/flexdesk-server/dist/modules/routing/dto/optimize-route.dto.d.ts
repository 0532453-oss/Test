export declare class LocationDto {
    lat: number;
    lng: number;
}
export declare class WaypointDto {
    id: string;
    location: LocationDto;
    name?: string;
    address?: string;
    estimatedDurationMinutes?: number;
    timeWindowStart?: string;
    timeWindowEnd?: string;
}
export declare class OptimizeRouteDto {
    origin: WaypointDto;
    waypoints: WaypointDto[];
    destination?: WaypointDto;
}
export declare class OptimizeTechnicianRouteDto {
    technicianId: string;
    date: string;
    startLocation?: LocationDto;
}
export declare class GetDirectionsDto {
    origin: LocationDto;
    destination: LocationDto;
}
export declare class DistanceMatrixDto {
    origins: LocationDto[];
    destinations: LocationDto[];
}

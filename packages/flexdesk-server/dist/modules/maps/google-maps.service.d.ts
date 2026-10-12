import { type ConfigService } from '@nestjs/config';
interface LatLng {
    lat: number;
    lng: number;
}
export interface DistanceMatrixResult {
    durationMinutes: number;
    distanceMeters: number;
    durationText: string;
    distanceText: string;
}
export declare class GoogleMapsService {
    private readonly configService;
    private readonly logger;
    private readonly apiKey;
    constructor(configService: ConfigService);
    getDistanceMatrix(origin: LatLng, destination: LatLng): Promise<DistanceMatrixResult | null>;
    geocodeAddress(address: string): Promise<LatLng | null>;
}
export {};

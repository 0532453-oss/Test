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
var GoogleMapsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleMapsService = void 0;
const common_1 = require("@nestjs/common");
let GoogleMapsService = GoogleMapsService_1 = class GoogleMapsService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(GoogleMapsService_1.name);
        this.apiKey = this.configService.get('GOOGLE_MAPS_API_KEY') ?? '';
    }
    async getDistanceMatrix(origin, destination) {
        if (!this.apiKey) {
            this.logger.warn('Google Maps API key not configured');
            return null;
        }
        try {
            const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
            url.searchParams.set('origins', `${origin.lat},${origin.lng}`);
            url.searchParams.set('destinations', `${destination.lat},${destination.lng}`);
            url.searchParams.set('mode', 'driving');
            url.searchParams.set('key', this.apiKey);
            const response = await fetch(url.toString());
            if (!response.ok) {
                this.logger.error(`Distance Matrix API request failed: ${response.status}`);
                return null;
            }
            const data = (await response.json());
            if (data.status !== 'OK') {
                this.logger.error(`Distance Matrix API error: ${data.status}`);
                return null;
            }
            const element = data.rows?.[0]?.elements?.[0];
            if (!element || element.status !== 'OK') {
                this.logger.warn(`Distance Matrix element error: ${element?.status ?? 'NO_ELEMENT'}`);
                return null;
            }
            return {
                durationMinutes: Math.round((element.duration?.value ?? 0) / 60),
                distanceMeters: element.distance?.value ?? 0,
                durationText: element.duration?.text ?? '',
                distanceText: element.distance?.text ?? '',
            };
        }
        catch (error) {
            this.logger.error('Distance Matrix API request failed', error);
            return null;
        }
    }
    async geocodeAddress(address) {
        if (!this.apiKey) {
            this.logger.warn('Google Maps API key not configured');
            return null;
        }
        try {
            const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
            url.searchParams.set('address', address);
            url.searchParams.set('key', this.apiKey);
            const response = await fetch(url.toString());
            if (!response.ok) {
                this.logger.error(`Geocoding API request failed: ${response.status}`);
                return null;
            }
            const data = (await response.json());
            if (data.status !== 'OK' || !data.results?.[0]) {
                this.logger.warn(`Geocoding failed for address: ${address}`);
                return null;
            }
            const location = data.results[0].geometry.location;
            return { lat: location.lat, lng: location.lng };
        }
        catch (error) {
            this.logger.error('Geocoding API request failed', error);
            return null;
        }
    }
};
exports.GoogleMapsService = GoogleMapsService;
exports.GoogleMapsService = GoogleMapsService = GoogleMapsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Function])
], GoogleMapsService);

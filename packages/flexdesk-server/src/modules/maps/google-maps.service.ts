/**
 * Google Maps Service
 *
 * Provides integration with Google Maps APIs including:
 * - Distance Matrix API for travel time/distance calculations
 * - Geocoding API for address lookups (fallback)
 */

import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

interface DistanceMatrixResponse {
  rows: Array<{
    elements: Array<{
      status: string;
      duration?: { value: number; text: string };
      distance?: { value: number; text: string };
    }>;
  }>;
  status: string;
}

@Injectable()
export class GoogleMapsService implements OnModuleInit {
  private readonly logger = new Logger(GoogleMapsService.name);
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY') ?? '';
  }

  onModuleInit() {
    if (!this.apiKey) {
      this.logger.warn(
        'Google Maps API key not configured - maps features will return errors',
      );
    }
  }

  /**
   * Get travel time and distance between two points using Google Distance Matrix API
   */
  async getDistanceMatrix(
    origin: LatLng,
    destination: LatLng,
  ): Promise<DistanceMatrixResult | null> {
    if (!this.apiKey) {
      this.logger.warn('Google Maps API key not configured');
      return null;
    }

    try {
      const url = new URL(
        'https://maps.googleapis.com/maps/api/distancematrix/json',
      );
      url.searchParams.set('origins', `${origin.lat},${origin.lng}`);
      url.searchParams.set('destinations', `${destination.lat},${destination.lng}`);
      url.searchParams.set('mode', 'driving');
      url.searchParams.set('key', this.apiKey);

      const response = await fetch(url.toString());

      if (!response.ok) {
        this.logger.error(
          `Distance Matrix API request failed: ${response.status}`,
        );
        return null;
      }

      const data = (await response.json()) as DistanceMatrixResponse;

      if (data.status !== 'OK') {
        this.logger.error(`Distance Matrix API error: ${data.status}`);
        return null;
      }

      const element = data.rows?.[0]?.elements?.[0];

      if (!element || element.status !== 'OK') {
        this.logger.warn(
          `Distance Matrix element error: ${element?.status ?? 'NO_ELEMENT'}`,
        );
        return null;
      }

      return {
        durationMinutes: Math.round((element.duration?.value ?? 0) / 60),
        distanceMeters: element.distance?.value ?? 0,
        durationText: element.duration?.text ?? '',
        distanceText: element.distance?.text ?? '',
      };
    } catch (error) {
      this.logger.error('Distance Matrix API request failed', error);
      return null;
    }
  }

  /**
   * Geocode an address to lat/lng coordinates (fallback for jobs without coordinates)
   */
  async geocodeAddress(address: string): Promise<LatLng | null> {
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

      const data = (await response.json()) as {
        status: string;
        results: Array<{
          geometry: {
            location: { lat: number; lng: number };
          };
        }>;
      };

      if (data.status !== 'OK' || !data.results?.[0]) {
        this.logger.warn(`Geocoding failed for address: ${address}`);
        return null;
      }

      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    } catch (error) {
      this.logger.error('Geocoding API request failed', error);
      return null;
    }
  }
}

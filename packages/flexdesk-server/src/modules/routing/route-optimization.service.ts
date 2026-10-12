import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  calculateDistance,
  type Location,
  isValidLocation,
} from '../jobs/utils/geofenceValidator';

import { PrismaService } from '@/core/database/prisma.service';
import { getWorkspaceId } from '@/core/database/workspace-context';

/**
 * Waypoint for route optimization
 */
export interface RouteWaypoint {
  id: string;
  location: Location;
  name?: string;
  address?: string;
  estimatedDurationMinutes?: number;
  timeWindowStart?: Date;
  timeWindowEnd?: Date;
}

/**
 * Optimized route leg between two waypoints
 */
export interface RouteLeg {
  fromWaypointId: string;
  toWaypointId: string;
  distanceMeters: number;
  durationSeconds: number;
  polyline?: string;
}

/**
 * Result of route optimization
 */
export interface OptimizedRoute {
  waypointOrder: string[];
  legs: RouteLeg[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  optimizationMethod: 'google_maps' | 'nearest_neighbor' | 'haversine';
}

/**
 * Distance matrix result
 */
export interface DistanceMatrixResult {
  originIndex: number;
  destinationIndex: number;
  distanceMeters: number;
  durationSeconds: number;
}

/**
 * Google Maps Routes API response structures
 */
interface GoogleRoutesResponse {
  routes: Array<{
    distanceMeters: number;
    duration: string;
    polyline?: { encodedPolyline: string };
    legs?: Array<{
      distanceMeters: number;
      duration: string;
      startLocation?: { latLng: { latitude: number; longitude: number } };
      endLocation?: { latLng: { latitude: number; longitude: number } };
    }>;
    optimizedIntermediateWaypointIndex?: number[];
  }>;
}

interface GoogleDistanceMatrixResponse {
  originIndex: number;
  destinationIndex: number;
  distanceMeters: number;
  duration: string;
}

@Injectable()
export class RouteOptimizationService {
  private readonly logger = new Logger(RouteOptimizationService.name);
  private readonly apiKey: string | null;
  private readonly baseUrl = 'https://routes.googleapis.com';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.apiKey = this.configService.get<string>('googleMaps.apiKey') || null;
    if (!this.apiKey) {
      this.logger.warn(
        'Google Maps API key not configured. Route optimization will use fallback nearest-neighbor algorithm.',
      );
    }
  }

  private getWorkspaceIdOrThrow(): string {
    const workspaceId = getWorkspaceId();
    if (!workspaceId) {
      throw new BadRequestException('Workspace context is required');
    }
    return workspaceId;
  }

  /**
   * Check if Google Maps API is configured
   */
  isGoogleMapsConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Optimize route for a list of waypoints using Google Maps Routes API
   * Falls back to nearest-neighbor algorithm if Google Maps is not configured
   */
  async optimizeRoute(
    origin: RouteWaypoint,
    waypoints: RouteWaypoint[],
    destination?: RouteWaypoint,
  ): Promise<OptimizedRoute> {
    if (waypoints.length === 0) {
      throw new BadRequestException('At least one waypoint is required');
    }

    if (!isValidLocation(origin.location)) {
      throw new BadRequestException('Invalid origin location');
    }

    for (const wp of waypoints) {
      if (!isValidLocation(wp.location)) {
        throw new BadRequestException(`Invalid location for waypoint ${wp.id}`);
      }
    }

    if (destination && !isValidLocation(destination.location)) {
      throw new BadRequestException('Invalid destination location');
    }

    // Use Google Maps if configured, otherwise fall back to nearest-neighbor
    if (this.apiKey) {
      try {
        return await this.optimizeWithGoogleMaps(origin, waypoints, destination);
      } catch (error) {
        this.logger.error(
          `Google Maps route optimization failed, falling back to nearest-neighbor: ${error}`,
        );
        return this.optimizeWithNearestNeighbor(origin, waypoints, destination);
      }
    }

    return this.optimizeWithNearestNeighbor(origin, waypoints, destination);
  }

  /**
   * Optimize route using Google Maps Routes API with waypoint optimization
   */
  private async optimizeWithGoogleMaps(
    origin: RouteWaypoint,
    waypoints: RouteWaypoint[],
    destination?: RouteWaypoint,
  ): Promise<OptimizedRoute> {
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
        'X-Goog-Api-Key': this.apiKey!,
        'X-Goog-FieldMask':
          'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs,routes.optimizedIntermediateWaypointIndex',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Maps API error: ${response.status} - ${errorText}`);
    }

    const data: GoogleRoutesResponse = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes returned from Google Maps API');
    }

    const route = data.routes[0];
    const optimizedOrder = route.optimizedIntermediateWaypointIndex || [];

    // Build ordered waypoint IDs
    const waypointOrder: string[] = [origin.id];
    for (const index of optimizedOrder) {
      waypointOrder.push(waypoints[index].id);
    }
    if (destination) {
      waypointOrder.push(destination.id);
    }

    // Build legs from route data
    const legs: RouteLeg[] = [];
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
          polyline: undefined, // Individual leg polylines not available in optimized routes
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

  /**
   * Fallback nearest-neighbor algorithm for route optimization
   * Uses Haversine distance when Google Maps is not available
   */
  optimizeWithNearestNeighbor(
    origin: RouteWaypoint,
    waypoints: RouteWaypoint[],
    destination?: RouteWaypoint,
  ): OptimizedRoute {
    const unvisited = [...waypoints];
    const orderedWaypoints: RouteWaypoint[] = [];
    let currentPoint = origin;

    // Greedy nearest-neighbor selection
    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const distance = calculateDistance(
          currentPoint.location,
          unvisited[i].location,
        );
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const nearest = unvisited.splice(nearestIndex, 1)[0];
      orderedWaypoints.push(nearest);
      currentPoint = nearest;
    }

    // Build waypoint order
    const waypointOrder: string[] = [origin.id];
    for (const wp of orderedWaypoints) {
      waypointOrder.push(wp.id);
    }
    if (destination) {
      waypointOrder.push(destination.id);
    }

    // Calculate legs using Haversine distance
    const legs: RouteLeg[] = [];
    const allPoints = [origin, ...orderedWaypoints, ...(destination ? [destination] : [])];
    let totalDistance = 0;

    for (let i = 0; i < allPoints.length - 1; i++) {
      const distanceMeters = calculateDistance(
        allPoints[i].location,
        allPoints[i + 1].location,
      );
      // Estimate duration: assume 40 km/h average speed for field service
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

  /**
   * Get distance matrix for multiple origins and destinations
   */
  async getDistanceMatrix(
    origins: Location[],
    destinations: Location[],
  ): Promise<DistanceMatrixResult[]> {
    for (const origin of origins) {
      if (!isValidLocation(origin)) {
        throw new BadRequestException('Invalid origin location in matrix');
      }
    }
    for (const dest of destinations) {
      if (!isValidLocation(dest)) {
        throw new BadRequestException('Invalid destination location in matrix');
      }
    }

    if (this.apiKey) {
      try {
        return await this.getDistanceMatrixFromGoogleMaps(origins, destinations);
      } catch (error) {
        this.logger.error(
          `Google Maps distance matrix failed, using Haversine: ${error}`,
        );
        return this.getDistanceMatrixHaversine(origins, destinations);
      }
    }

    return this.getDistanceMatrixHaversine(origins, destinations);
  }

  /**
   * Get distance matrix from Google Maps Routes API
   */
  private async getDistanceMatrixFromGoogleMaps(
    origins: Location[],
    destinations: Location[],
  ): Promise<DistanceMatrixResult[]> {
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
        'X-Goog-Api-Key': this.apiKey!,
        'X-Goog-FieldMask': 'originIndex,destinationIndex,distanceMeters,duration',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Maps API error: ${response.status} - ${errorText}`);
    }

    // Route Matrix API returns newline-delimited JSON
    const text = await response.text();
    const results: DistanceMatrixResult[] = [];

    for (const line of text.split('\n')) {
      if (line.trim()) {
        const entry: GoogleDistanceMatrixResponse = JSON.parse(line);
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

  /**
   * Calculate distance matrix using Haversine formula (fallback)
   */
  private getDistanceMatrixHaversine(
    origins: Location[],
    destinations: Location[],
  ): DistanceMatrixResult[] {
    const results: DistanceMatrixResult[] = [];

    for (let i = 0; i < origins.length; i++) {
      for (let j = 0; j < destinations.length; j++) {
        const distanceMeters = calculateDistance(origins[i], destinations[j]);
        // Estimate duration: assume 40 km/h average speed
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

  /**
   * Optimize technician route for a day's jobs
   */
  async optimizeTechnicianRoute(
    technicianId: string,
    date: Date,
    technicianStartLocation?: Location,
  ): Promise<OptimizedRoute> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    // Get technician with current location
    const technician = await this.prisma.technician.findFirst({
      where: { id: technicianId, workspaceId },
    });

    if (!technician) {
      throw new BadRequestException('Technician not found');
    }

    // Parse start location from technician's current location or provided location
    let startLocation: Location;
    if (technicianStartLocation && isValidLocation(technicianStartLocation)) {
      startLocation = technicianStartLocation;
    } else if (technician.currentLocation) {
      const loc = technician.currentLocation as { lat?: number; lng?: number };
      if (loc.lat && loc.lng) {
        startLocation = { lat: loc.lat, lng: loc.lng };
      } else {
        throw new BadRequestException(
          'Technician start location not available. Please provide technicianStartLocation.',
        );
      }
    } else {
      throw new BadRequestException(
        'Technician start location not available. Please provide technicianStartLocation.',
      );
    }

    // Get jobs scheduled for this technician on the given date
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
      throw new BadRequestException('No jobs scheduled for this technician on the given date');
    }

    // Convert jobs to waypoints
    const waypoints: RouteWaypoint[] = jobs.map((job) => {
      let location: Location | null = null;
      let address: string | undefined;

      // Prefer property location if available
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
      } else if (job.location) {
        // Fallback to legacy location field
        const loc = job.location as { lat?: number; lng?: number; address?: string };
        if (loc.lat && loc.lng) {
          location = { lat: loc.lat, lng: loc.lng };
          address = loc.address;
        }
      }

      if (!location) {
        throw new BadRequestException(
          `Job ${job.id} does not have a valid location`,
        );
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

    const origin: RouteWaypoint = {
      id: 'technician_start',
      location: startLocation,
      name: 'Start Location',
    };

    return this.optimizeRoute(origin, waypoints);
  }

  /**
   * Parse Google Maps duration string (e.g., "3600s") to seconds
   */
  private parseDuration(duration: string): number {
    if (!duration) return 0;
    // Duration format is like "3600s"
    const match = duration.match(/(\d+)s/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Get directions between two points (single route, no optimization)
   */
  async getDirections(
    origin: Location,
    destination: Location,
  ): Promise<{
    distanceMeters: number;
    durationSeconds: number;
    polyline?: string;
  }> {
    if (!isValidLocation(origin)) {
      throw new BadRequestException('Invalid origin location');
    }
    if (!isValidLocation(destination)) {
      throw new BadRequestException('Invalid destination location');
    }

    if (this.apiKey) {
      try {
        return await this.getDirectionsFromGoogleMaps(origin, destination);
      } catch (error) {
        this.logger.error(
          `Google Maps directions failed, using Haversine: ${error}`,
        );
      }
    }

    // Fallback to Haversine
    const distanceMeters = calculateDistance(origin, destination);
    const durationSeconds = Math.round((distanceMeters / 1000 / 40) * 3600);

    return {
      distanceMeters,
      durationSeconds,
    };
  }

  /**
   * Get directions from Google Maps Routes API
   */
  private async getDirectionsFromGoogleMaps(
    origin: Location,
    destination: Location,
  ): Promise<{
    distanceMeters: number;
    durationSeconds: number;
    polyline?: string;
  }> {
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
        'X-Goog-Api-Key': this.apiKey!,
        'X-Goog-FieldMask':
          'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Maps API error: ${response.status} - ${errorText}`);
    }

    const data: GoogleRoutesResponse = await response.json();

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
}

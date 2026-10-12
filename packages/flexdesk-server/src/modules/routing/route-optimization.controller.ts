import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import {
  type OptimizeRouteDto,
  type OptimizeTechnicianRouteDto,
  type GetDirectionsDto,
  type DistanceMatrixDto,
} from './dto/optimize-route.dto';
import { RouteOptimizationService, type RouteWaypoint } from './route-optimization.service';

@ApiTags('Route Optimization')
@ApiBearerAuth()
@Controller('routes')
export class RouteOptimizationController {
  constructor(
    private readonly routeOptimizationService: RouteOptimizationService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Check route optimization service status' })
  @ApiResponse({
    status: 200,
    description: 'Returns whether Google Maps API is configured',
  })
  getStatus() {
    return {
      googleMapsConfigured: this.routeOptimizationService.isGoogleMapsConfigured(),
      fallbackMethod: 'nearest_neighbor',
    };
  }

  @Post('optimize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Optimize route for a list of waypoints' })
  @ApiResponse({
    status: 200,
    description: 'Returns optimized route with waypoint order and distances',
  })
  async optimizeRoute(@Body() dto: OptimizeRouteDto) {
    const origin: RouteWaypoint = {
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

    const waypoints: RouteWaypoint[] = dto.waypoints.map((wp) => ({
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

    return this.routeOptimizationService.optimizeRoute(
      origin,
      waypoints,
      destination,
    );
  }

  @Post('optimize-technician')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Optimize route for a technician\'s daily jobs' })
  @ApiResponse({
    status: 200,
    description: 'Returns optimized route for technician\'s scheduled jobs',
  })
  async optimizeTechnicianRoute(@Body() dto: OptimizeTechnicianRouteDto) {
    return this.routeOptimizationService.optimizeTechnicianRoute(
      dto.technicianId,
      new Date(dto.date),
      dto.startLocation,
    );
  }

  @Post('directions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get directions between two points' })
  @ApiResponse({
    status: 200,
    description: 'Returns distance, duration, and optional polyline',
  })
  async getDirections(@Body() dto: GetDirectionsDto) {
    return this.routeOptimizationService.getDirections(
      dto.origin,
      dto.destination,
    );
  }

  @Post('distance-matrix')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get distance matrix for multiple origins/destinations' })
  @ApiResponse({
    status: 200,
    description: 'Returns distance matrix with all origin-destination pairs',
  })
  async getDistanceMatrix(@Body() dto: DistanceMatrixDto) {
    return this.routeOptimizationService.getDistanceMatrix(
      dto.origins,
      dto.destinations,
    );
  }
}

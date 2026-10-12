import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { type Prisma, type Technician, SyncStatus, JobStatus } from '@prisma/client';

import { GoogleMapsService } from '../maps/google-maps.service';

import { type CreateTechnicianDto } from './dto/create-technician.dto';
import {
  type NextJobResponseDto,
  type NoNextJobResponseDto,
} from './dto/next-job-response.dto';
import { type UpdateTechnicianDto } from './dto/update-technician.dto';

import { PrismaService } from '@/core/database/prisma.service';
import { BaseService } from '@/engine/base.service';



interface LocationInput {
  lat: number;
  lng: number;
}

interface JobLocation {
  address?: string;
  lat: number;
  lng: number;
}

@Injectable()
export class TechnicianService extends BaseService<Prisma.TechnicianDelegate> {
  constructor(
    prisma: PrismaService,
    private readonly googleMapsService: GoogleMapsService,
  ) {
    super(prisma, prisma.technician, 'Technician');
  }

  async createTechnician(dto: CreateTechnicianDto): Promise<Technician> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const existingByUser = await this.prisma.technician.findFirst({
      where: { userId: dto.userId },
    });

    if (existingByUser) {
      throw new ConflictException('User is already a technician');
    }

    const data: Prisma.TechnicianCreateInput = {
      workspace: { connect: { id: workspaceId } },
      user: { connect: { id: dto.userId } },
      phone: dto.phone,
      licenseNumber: dto.licenseNumber,
      specialties: dto.specialties || [],
      isAvailable: true,
      syncStatus: SyncStatus.PENDING,
      syncVersion: 0,
    };

    const technician = await this.create({ data });
    return technician as Technician;
  }

  async findAllTechnicians(): Promise<Technician[]> {
    const technicians = await this.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return technicians as Technician[];
  }

  async findTechnicianById(id: string): Promise<Technician> {
    const technician = await this.findUniqueOrThrow({
      where: { id },
      include: { user: true },
    });
    return technician as Technician;
  }

  async findTechnicianByUserId(userId: string): Promise<Technician> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const technician = await this.prisma.technician.findFirst({
      where: { userId, workspaceId },
      include: { user: true },
    });

    if (!technician) {
      throw new NotFoundException('Technician not found for current user');
    }

    return technician;
  }

  async findAvailableTechnicians(available: boolean): Promise<Technician[]> {
    const workspaceId = this.getWorkspaceIdOrThrow();

    const technicians = await this.prisma.technician.findMany({
      where: { workspaceId, isAvailable: available },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    return technicians;
  }

  async updateTechnician(id: string, dto: UpdateTechnicianDto): Promise<Technician> {
    const existing = await this.findTechnicianById(id);

    const data: Prisma.TechnicianUpdateInput = {
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.licenseNumber !== undefined && { licenseNumber: dto.licenseNumber }),
      ...(dto.specialties !== undefined && { specialties: dto.specialties }),
      ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
      syncStatus: SyncStatus.PENDING,
      syncVersion: existing.syncVersion + 1,
    };

    const technician = await this.update({
      where: { id },
      data,
    });

    return technician as Technician;
  }

  async updateCurrentLocation(
    userId: string,
    location: LocationInput,
  ): Promise<void> {
    const technician = await this.findTechnicianByUserId(userId);

    const data: Prisma.TechnicianUpdateInput = {
      currentLocation: {
        lat: location.lat,
        lng: location.lng,
        updatedAt: new Date().toISOString(),
      } as Prisma.InputJsonValue,
      syncStatus: SyncStatus.PENDING,
      syncVersion: technician.syncVersion + 1,
    };

    await this.update({
      where: { id: technician.id },
      data,
    });
  }

  async setAvailability(id: string, isAvailable: boolean): Promise<Technician> {
    const existing = await this.findTechnicianById(id);

    const technician = await this.update({
      where: { id },
      data: {
        isAvailable,
        syncStatus: SyncStatus.PENDING,
        syncVersion: existing.syncVersion + 1,
      },
    });

    return technician as Technician;
  }

  /**
   * Get the next scheduled job for a technician
   * Returns job details with travel time from Google Distance Matrix API
   */
  async getNextJob(
    technicianId: string,
  ): Promise<NextJobResponseDto | NoNextJobResponseDto> {
    const technician = await this.findTechnicianById(technicianId);
    const now = new Date();

    // Check for job currently in progress
    const inProgressJob = await this.prisma.job.findFirst({
      where: {
        technicianId: technician.id,
        status: JobStatus.IN_PROGRESS,
      },
      include: { customer: true },
    });

    // Find the next scheduled/dispatched job (not completed, cancelled, or on hold)
    const nextJob = await this.prisma.job.findFirst({
      where: {
        technicianId: technician.id,
        status: {
          in: [JobStatus.SCHEDULED, JobStatus.DISPATCHED],
        },
        scheduledAt: {
          gte: now,
        },
      },
      include: { customer: true },
      orderBy: { scheduledAt: 'asc' },
    });

    // If no future job found, check for any scheduled job today (even if past start time)
    const fallbackJob =
      nextJob ??
      (await this.prisma.job.findFirst({
        where: {
          technicianId: technician.id,
          status: {
            in: [JobStatus.SCHEDULED, JobStatus.DISPATCHED],
          },
          scheduledAt: {
            gte: new Date(now.toDateString()), // Start of today
            lt: new Date(new Date(now.toDateString()).getTime() + 24 * 60 * 60 * 1000), // End of today
          },
        },
        include: { customer: true },
        orderBy: { scheduledAt: 'asc' },
      }));

    const targetJob = nextJob ?? fallbackJob;

    if (!targetJob) {
      return {
        hasNextJob: false,
        message: 'No upcoming jobs scheduled',
        hasJobInProgress: !!inProgressJob,
        inProgressJobId: inProgressJob?.id,
      };
    }

    let jobLocation = targetJob.location as JobLocation | null;
    const technicianLocation = technician.currentLocation as LocationInput | null;

    // Geocoding fallback: if job has address but no coordinates, try to geocode
    if (
      jobLocation?.address &&
      (jobLocation.lat === undefined ||
        jobLocation.lng === undefined ||
        isNaN(jobLocation.lat) ||
        isNaN(jobLocation.lng))
    ) {
      try {
        const geocoded = await this.googleMapsService.geocodeAddress(
          jobLocation.address,
        );
        if (geocoded) {
          jobLocation = {
            ...jobLocation,
            lat: geocoded.lat,
            lng: geocoded.lng,
          };
        }
      } catch {
        // Geocoding failed - continue without coordinates
      }
    }

    // Calculate minutes until start
    const scheduledTime = targetJob.scheduledAt
      ? new Date(targetJob.scheduledAt)
      : now;
    const minutesUntilStart = Math.round(
      (scheduledTime.getTime() - now.getTime()) / (1000 * 60),
    );

    // Build Google Maps directions URL
    let directionsUrl = '';
    if (jobLocation?.lat && jobLocation?.lng) {
      directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${jobLocation.lat},${jobLocation.lng}&travelmode=driving`;
    }

    // Try to get travel time from Google Distance Matrix API
    let travelTimeMinutes: number | undefined;
    let travelDistanceMeters: number | undefined;

    if (
      technicianLocation?.lat &&
      technicianLocation?.lng &&
      jobLocation?.lat &&
      jobLocation?.lng
    ) {
      try {
        const distanceResult = await this.googleMapsService.getDistanceMatrix(
          { lat: technicianLocation.lat, lng: technicianLocation.lng },
          { lat: jobLocation.lat, lng: jobLocation.lng },
        );
        travelTimeMinutes = distanceResult?.durationMinutes;
        travelDistanceMeters = distanceResult?.distanceMeters;
      } catch {
        // Silently fail - travel time is optional
      }
    }

    return {
      jobId: targetJob.id,
      customerName: targetJob.customer?.name ?? 'Unknown Customer',
      title: targetJob.title,
      address: jobLocation?.address,
      lat: jobLocation?.lat,
      lng: jobLocation?.lng,
      scheduledAt: targetJob.scheduledAt?.toISOString() ?? now.toISOString(),
      travelTimeMinutes,
      travelDistanceMeters,
      minutesUntilStart,
      directionsUrl,
      hasJobInProgress: !!inProgressJob,
      inProgressJobId: inProgressJob?.id,
    };
  }
}


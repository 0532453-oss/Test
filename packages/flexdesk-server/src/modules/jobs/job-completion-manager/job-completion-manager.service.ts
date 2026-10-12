import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/core/database';
import {
  calculateDistance,
  type Location,
} from '../utils/geofenceValidator';

/**
 * Job Completion Manager
 *
 * Handles all job completion operations:
 * - Marking jobs complete
 * - Capturing completion data (photos, signatures, notes)
 * - Triggering post-completion workflows (invoicing, follow-ups)
 * - Geofence validation
 */
@Injectable()
export class JobCompletionManagerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Start a job (technician arrived)
   */
  async startJob(params: {
    jobId: string;
    workspaceId: string;
    userId: string;
    technicianLocation?: { lat: number; lng: number };
  }) {
    const { jobId, workspaceId, technicianLocation } = params;

    let geofenceWarning: string | undefined;
    if (technicianLocation) {
      const geofenceResult = await this.validateGeofence({
        jobId,
        technicianLocation,
        workspaceId,
      });
      if (!geofenceResult.isValid) {
        geofenceWarning = geofenceResult.warning;
      }
    }

    const job = await this.prisma.job.update({
      where: { id: jobId, workspaceId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    return { ...job, geofenceWarning };
  }

  /**
   * Complete a job
   */
  async completeJob(params: {
    jobId: string;
    workspaceId: string;
    userId: string;
    completionData: {
      notes?: string;
      partsUsed?: Array<{ partId: string; quantity: number }>;
      laborHours?: number;
      photos?: string[];
      customerSignature?: string;
    };
    technicianLocation?: { lat: number; lng: number };
  }) {
    const { jobId, workspaceId, userId, completionData, technicianLocation } = params;

    let geofenceWarning: string | undefined;
    if (technicianLocation) {
      const geofenceResult = await this.validateGeofence({
        jobId,
        technicianLocation,
        workspaceId,
      });
      if (!geofenceResult.isValid) {
        geofenceWarning = geofenceResult.warning;
      }
    }

    const job = await this.prisma.job.update({
      where: { id: jobId, workspaceId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        // Note: completion notes and labor hours should be stored as JobNote
        // or in a separate completion record
      },
      include: {
        customer: true,
      },
    });

    // Store completion notes as a job note if provided
    if (completionData.notes) {
      await this.prisma.jobNote.create({
        data: {
          jobId,
          userId,
          content: completionData.notes,
          isInternal: false,
        },
      });
    }

    // TODO: Trigger post-completion workflows
    // - Generate invoice
    // - Send completion notification to customer
    // - Update technician metrics

    return { ...job, geofenceWarning };
  }

  /**
   * Put a job on hold
   */
  async putJobOnHold(params: {
    jobId: string;
    workspaceId: string;
    userId: string;
    reason: string;
    followUpDate?: Date;
  }) {
    const { jobId, workspaceId, userId, reason, followUpDate } = params;

    const job = await this.prisma.job.update({
      where: { id: jobId, workspaceId },
      data: {
        status: 'ON_HOLD',
        // Note: hold reason should be stored as a JobNote
      },
    });

    // Store hold reason as a job note
    if (reason) {
      await this.prisma.jobNote.create({
        data: {
          jobId,
          userId,
          content: `Job put on hold: ${reason}`,
          isInternal: true,
        },
      });
    }

    return job;
  }

  /**
   * Cancel a job
   */
  async cancelJob(params: {
    jobId: string;
    workspaceId: string;
    reason: string;
    cancelledBy: string;
  }) {
    const { jobId, workspaceId, reason, cancelledBy } = params;

    const job = await this.prisma.job.update({
      where: { id: jobId, workspaceId },
      data: {
        status: 'CANCELLED',
        // Note: cancellation reason should be stored as a JobNote
      },
    });

    // Store cancellation reason as a job note
    if (reason) {
      await this.prisma.jobNote.create({
        data: {
          jobId,
          userId: cancelledBy,
          content: `Job cancelled: ${reason}`,
          isInternal: true,
        },
      });
    }

    return job;
  }

  /**
   * Validate technician is within geofence.
   * Returns a warning (not a hard block) if outside the configured radius.
   */
  async validateGeofence(params: {
    jobId: string;
    technicianLocation: { lat: number; lng: number };
    workspaceId: string;
    radiusMeters?: number;
  }): Promise<{ isValid: boolean; distance?: number; warning?: string }> {
    const { jobId, technicianLocation, workspaceId, radiusMeters = 200 } =
      params;

    const job = await this.prisma.job.findUnique({
      where: { id: jobId, workspaceId },
      include: { property: true },
    });

    // Try property location first, then fall back to job.location JSON
    let jobLocation: Location | null = null;

    if (job?.property?.lat != null && job?.property?.lng != null) {
      jobLocation = { lat: job.property.lat, lng: job.property.lng };
    } else if (job?.location) {
      const loc = job.location as { lat?: number; lng?: number };
      if (loc.lat != null && loc.lng != null) {
        jobLocation = { lat: loc.lat, lng: loc.lng };
      }
    }

    if (!jobLocation) {
      return { isValid: true }; // No location data — skip geofence check
    }

    const distance = calculateDistance(jobLocation, technicianLocation);
    const isValid = distance <= radiusMeters;

    return {
      isValid,
      distance,
      warning: isValid
        ? undefined
        : `Technician is ${distance}m away from the job site (radius: ${radiusMeters}m)`,
    };
  }

  /**
   * Get completion summary for a job
   */
  async getCompletionSummary(params: {
    jobId: string;
    workspaceId: string;
  }) {
    const { jobId, workspaceId } = params;

    return this.prisma.job.findUnique({
      where: { id: jobId, workspaceId },
      include: {
        customer: true,
        technician: true,
        property: true,
        invoice: true,
      },
    });
  }
}

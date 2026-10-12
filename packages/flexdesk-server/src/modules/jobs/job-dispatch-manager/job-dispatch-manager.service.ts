import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/core/database';

/**
 * Job Dispatch Manager
 *
 * Handles all job dispatch operations:
 * - Dispatching jobs to technicians
 * - Route optimization
 * - Real-time dispatch updates
 * - Technician location tracking integration
 */
@Injectable()
export class JobDispatchManagerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Dispatch a job to a technician
   */
  async dispatchJob(params: {
    jobId: string;
    technicianId: string;
    workspaceId: string;
    notifyTechnician?: boolean;
  }) {
    const { jobId, technicianId, workspaceId, notifyTechnician = true } = params;

    const job = await this.prisma.job.update({
      where: { id: jobId, workspaceId },
      data: {
        technicianId,
        status: 'DISPATCHED',
        // Note: dispatchedAt is not in schema - status change is tracked via updatedAt
      },
      include: {
        customer: true,
        property: true,
      },
    });

    if (notifyTechnician) {
      // TODO: Send push notification to technician
    }

    return job;
  }

  /**
   * Bulk dispatch multiple jobs
   */
  async bulkDispatch(params: {
    assignments: Array<{ jobId: string; technicianId: string }>;
    workspaceId: string;
  }) {
    const { assignments, workspaceId } = params;

    const results = await Promise.all(
      assignments.map((assignment) =>
        this.dispatchJob({
          ...assignment,
          workspaceId,
          notifyTechnician: true,
        })
      )
    );

    return results;
  }

  /**
   * Get dispatch board data for a date
   */
  async getDispatchBoard(params: {
    date: Date;
    workspaceId: string;
  }) {
    const { date, workspaceId } = params;

    // Format date as YYYY-MM-DD string for scheduledDate field
    const dateString = date.toISOString().split('T')[0];

    const [jobs, technicians] = await Promise.all([
      this.prisma.job.findMany({
        where: {
          workspaceId,
          scheduledDate: dateString,
        },
        include: {
          customer: true,
          technician: true,
          property: true,
        },
        orderBy: { scheduledStartTime: 'asc' },
      }),
      this.prisma.technician.findMany({
        where: { workspaceId, isAvailable: true },
      }),
    ]);

    return { jobs, technicians, date };
  }

  /**
   * Reassign a job to a different technician
   */
  async reassignJob(params: {
    jobId: string;
    newTechnicianId: string;
    workspaceId: string;
    reason?: string;
  }) {
    const { jobId, newTechnicianId, workspaceId, reason } = params;

    // TODO: Add reassignment history tracking
    return this.prisma.job.update({
      where: { id: jobId, workspaceId },
      data: {
        technicianId: newTechnicianId,
      },
    });
  }

  /**
   * Optimize route for a technician's jobs
   */
  async optimizeRoute(params: {
    technicianId: string;
    date: Date;
    workspaceId: string;
  }) {
    // TODO: Integrate with maps/routing service
    return null;
  }
}

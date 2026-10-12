import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/core/database';
import { calculateDistance, type Location } from '../utils/geofenceValidator';

/**
 * Job Scheduling Manager
 *
 * Handles all job scheduling operations:
 * - Creating scheduled jobs
 * - Rescheduling jobs
 * - Time slot availability
 * - Technician assignment for scheduling
 */
@Injectable()
export class JobSchedulingManagerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Schedule a job for a specific time slot
   */
  async scheduleJob(params: {
    jobId: string;
    scheduledDate: string; // Format: YYYY-MM-DD
    scheduledStartTime: string; // Format: HH:mm
    technicianId?: string;
    workspaceId: string;
  }) {
    const { jobId, scheduledDate, scheduledStartTime, technicianId, workspaceId } = params;

    const scheduledAt = new Date(`${scheduledDate}T${scheduledStartTime}:00`);

    return this.prisma.job.update({
      where: { id: jobId, workspaceId },
      data: {
        scheduledDate,
        scheduledStartTime,
        scheduledAt,
        technicianId,
        status: 'SCHEDULED',
      },
    });
  }

  /**
   * Reschedule an existing job
   */
  async rescheduleJob(params: {
    jobId: string;
    newDate: string; // Format: YYYY-MM-DD
    newStartTime: string; // Format: HH:mm
    workspaceId: string;
    reason?: string;
  }) {
    const { jobId, newDate, newStartTime, workspaceId, reason } = params;

    // TODO: Add reschedule history tracking
    const scheduledAt = new Date(`${newDate}T${newStartTime}:00`);

    return this.prisma.job.update({
      where: { id: jobId, workspaceId },
      data: {
        scheduledDate: newDate,
        scheduledStartTime: newStartTime,
        scheduledAt,
      },
    });
  }

  /**
   * Get available time slots for a given date.
   * If technicianId is provided, returns slots for that technician.
   * Otherwise, returns slots per available technician.
   */
  async getAvailableSlots(params: {
    technicianId?: string;
    date: string; // Format: YYYY-MM-DD
    workspaceId: string;
  }): Promise<
    Array<{ startTime: string; endTime: string; technicianId?: string }>
  > {
    const { technicianId, date, workspaceId } = params;

    // Working hours: 8:00 AM to 6:00 PM
    const dayStartMinutes = 8 * 60; // 08:00
    const dayEndMinutes = 18 * 60; // 18:00

    if (technicianId) {
      return this.getSlotsForTechnician(
        technicianId,
        date,
        workspaceId,
        dayStartMinutes,
        dayEndMinutes,
      );
    }

    // No technician specified: get slots for all available technicians
    const technicians = await this.prisma.technician.findMany({
      where: { workspaceId, isAvailable: true },
      select: { id: true },
    });

    const allSlots: Array<{
      startTime: string;
      endTime: string;
      technicianId?: string;
    }> = [];

    for (const tech of technicians) {
      const slots = await this.getSlotsForTechnician(
        tech.id,
        date,
        workspaceId,
        dayStartMinutes,
        dayEndMinutes,
      );
      allSlots.push(...slots);
    }

    return allSlots;
  }

  /**
   * Calculate available slots for a single technician on a given date.
   */
  private async getSlotsForTechnician(
    technicianId: string,
    date: string,
    workspaceId: string,
    dayStartMinutes: number,
    dayEndMinutes: number,
  ): Promise<
    Array<{ startTime: string; endTime: string; technicianId: string }>
  > {
    const existingJobs = await this.prisma.job.findMany({
      where: {
        technicianId,
        workspaceId,
        scheduledDate: date,
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
      },
      select: {
        scheduledStartTime: true,
        scheduledEndTime: true,
        estimatedDuration: true,
      },
      orderBy: { scheduledStartTime: 'asc' },
    });

    // Convert jobs to occupied intervals in minutes
    const occupied = existingJobs
      .filter((j) => j.scheduledStartTime)
      .map((j) => {
        const start = this.toMinutes(j.scheduledStartTime!);
        const end = j.scheduledEndTime
          ? this.toMinutes(j.scheduledEndTime)
          : start + (j.estimatedDuration ?? 60);
        return { start, end };
      })
      .sort((a, b) => a.start - b.start);

    // Find gaps between occupied intervals within working hours
    const slots: Array<{
      startTime: string;
      endTime: string;
      technicianId: string;
    }> = [];
    let cursor = dayStartMinutes;

    for (const interval of occupied) {
      if (cursor < interval.start) {
        slots.push({
          startTime: this.fromMinutes(cursor),
          endTime: this.fromMinutes(interval.start),
          technicianId,
        });
      }
      cursor = Math.max(cursor, interval.end);
    }

    // Add remaining time after last job until end of day
    if (cursor < dayEndMinutes) {
      slots.push({
        startTime: this.fromMinutes(cursor),
        endTime: this.fromMinutes(dayEndMinutes),
        technicianId,
      });
    }

    return slots;
  }

  /**
   * Convert HH:mm time string to minutes since midnight.
   */
  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * Convert minutes since midnight to HH:mm time string.
   */
  private fromMinutes(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /**
   * Suggest the best available technician for a job based on
   * availability, proximity, and workload.
   *
   * Scoring weights:
   * - Availability (isAvailable flag): required filter
   * - Not on a conflicting job at the same time: +40 points
   * - Proximity to job location (if both locations available): up to +30 points
   * - Lowest workload (fewest active jobs): up to +30 points
   */
  async suggestTechnician(params: {
    jobId: string;
    requiredSkills?: string[];
    workspaceId: string;
  }): Promise<
    Array<{
      technicianId: string;
      technicianName: string;
      score: number;
      activeJobCount: number;
      distanceMeters: number | null;
    }>
  > {
    const { jobId, requiredSkills, workspaceId } = params;

    // Fetch the job to get its schedule and location
    const job = await this.prisma.job.findUnique({
      where: { id: jobId, workspaceId },
      select: {
        scheduledDate: true,
        scheduledStartTime: true,
        scheduledEndTime: true,
        location: true,
        property: { select: { lat: true, lng: true } },
      },
    });

    if (!job) return [];

    // Resolve job location: property coords first, then job.location JSON
    let jobLocation: Location | null = null;
    if (job.property?.lat != null && job.property?.lng != null) {
      jobLocation = { lat: job.property.lat, lng: job.property.lng };
    } else if (job.location && typeof job.location === 'object') {
      const loc = job.location as Record<string, unknown>;
      if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
        jobLocation = { lat: loc.lat, lng: loc.lng };
      }
    }

    // Get all available technicians in the workspace
    const technicians = await this.prisma.technician.findMany({
      where: {
        workspaceId,
        isAvailable: true,
        ...(requiredSkills?.length
          ? { specialties: { hasSome: requiredSkills } }
          : {}),
      },
      include: {
        user: true,
      },
    });

    if (technicians.length === 0) return [];

    // Count active jobs per technician (SCHEDULED, DISPATCHED, IN_PROGRESS)
    const activeJobCounts = await this.prisma.job.groupBy({
      by: ['technicianId'],
      where: {
        workspaceId,
        technicianId: { in: technicians.map((t) => t.id) },
        status: { in: ['SCHEDULED', 'DISPATCHED', 'IN_PROGRESS'] },
      },
      _count: { id: true },
    });

    const countMap = new Map(
      activeJobCounts.map((c) => [c.technicianId, c._count.id]),
    );

    // Check for time-slot conflicts if the job has a scheduled time
    let conflictingTechIds = new Set<string>();
    if (job.scheduledDate && job.scheduledStartTime) {
      const conflictingJobs = await this.prisma.job.findMany({
        where: {
          workspaceId,
          technicianId: { in: technicians.map((t) => t.id) },
          scheduledDate: job.scheduledDate,
          status: { notIn: ['CANCELLED', 'COMPLETED'] },
        },
        select: {
          technicianId: true,
          scheduledStartTime: true,
          scheduledEndTime: true,
          estimatedDuration: true,
        },
      });

      for (const cj of conflictingJobs) {
        if (!cj.technicianId || !cj.scheduledStartTime) continue;
        if (this.timeSlotsOverlap(
          job.scheduledStartTime,
          job.scheduledEndTime,
          cj.scheduledStartTime,
          cj.scheduledEndTime,
          cj.estimatedDuration,
        )) {
          conflictingTechIds.add(cj.technicianId);
        }
      }
    }

    // Find the max active job count for normalization
    const maxJobs = Math.max(
      1,
      ...technicians.map((t) => countMap.get(t.id) ?? 0),
    );

    // Score each technician
    const scored = technicians.map((tech) => {
      let score = 0;
      const activeJobCount = countMap.get(tech.id) ?? 0;

      // No time-slot conflict: +40 points
      if (!conflictingTechIds.has(tech.id)) {
        score += 40;
      }

      // Proximity score: up to +30 points (closer = higher score)
      let distanceMeters: number | null = null;
      if (jobLocation && tech.currentLocation && typeof tech.currentLocation === 'object') {
        const loc = tech.currentLocation as Record<string, unknown>;
        if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
          distanceMeters = calculateDistance(jobLocation, { lat: loc.lat, lng: loc.lng });
          // Within 5km = full 30 points, beyond 50km = 0 points, linear in between
          const maxDist = 50000;
          const proximityRatio = Math.max(0, 1 - distanceMeters / maxDist);
          score += Math.round(proximityRatio * 30);
        }
      }

      // Workload score: up to +30 points (fewer jobs = higher score)
      const workloadRatio = 1 - activeJobCount / maxJobs;
      score += Math.round(workloadRatio * 30);

      return {
        technicianId: tech.id,
        technicianName: [tech.user?.firstName, tech.user?.lastName].filter(Boolean).join(' ') || 'Unknown',
        score,
        activeJobCount,
        distanceMeters,
      };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    return scored;
  }

  /**
   * Auto-assign technician based on availability and skills.
   * Returns the top suggestion from suggestTechnician.
   */
  async autoAssignTechnician(params: {
    jobId: string;
    requiredSkills?: string[];
    workspaceId: string;
  }) {
    const suggestions = await this.suggestTechnician(params);
    if (suggestions.length === 0) return null;
    return suggestions[0];
  }

  /**
   * Check if two time slots overlap.
   * Uses estimatedDuration to infer end time if not explicitly set.
   */
  private timeSlotsOverlap(
    start1: string,
    end1: string | null,
    start2: string,
    end2: string | null,
    estimatedDuration2: number | null,
  ): boolean {
    const s1 = this.toMinutes(start1);
    const e1 = end1 ? this.toMinutes(end1) : s1 + 60; // default 1 hour
    const s2 = this.toMinutes(start2);
    const e2 = end2 ? this.toMinutes(end2) : s2 + (estimatedDuration2 ?? 60);

    return s1 < e2 && s2 < e1;
  }
}

/**
 * Schedule Sync - Specialized sync for technician schedules
 * 
 * Optimized for mobile devices - only syncs current day's schedule
 */

import { syncEngine } from './SyncEngine';

function format(date: Date, formatStr: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  if (formatStr === 'yyyy-MM-dd') return `${year}-${month}-${day}`;
  return `${year}-${month}-${day}`;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export interface ScheduleSyncOptions {
  technicianId: string;
  date?: Date;
  forceRefresh?: boolean;
}

export class ScheduleSync {
  /**
   * Sync current day's schedule for a technician
   */
  async syncCurrentDaySchedule(options: ScheduleSyncOptions): Promise<any[]> {
    const { technicianId, date = new Date(), forceRefresh = false } = options;

    // Check if we already have today's schedule cached
    if (!forceRefresh) {
      const cached = await syncEngine.getCachedSchedule(technicianId, date);
      
      if (cached.length > 0) {
        const firstScheduledAt = cached[0].scheduledAt
          ? new Date(cached[0].scheduledAt)
          : null;

        if (firstScheduledAt && isSameDay(firstScheduledAt, date)) {
          return cached;
        }
      }
    }

    // Sync from server (technician is inferred on the backend)
    await syncEngine.syncTechnicianSchedule(date);

    // Return cached schedule
    return syncEngine.getCachedSchedule(technicianId, date);
  }

  /**
   * Sync multiple days (for offline preparation)
   */
  async syncDateRange(
    technicianId: string,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      await syncEngine.syncTechnicianSchedule(currentDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  /**
   * Get schedule for a specific date (from cache or sync)
   */
  async getSchedule(
    technicianId: string,
    date: Date = new Date()
  ): Promise<any[]> {
    // Try cache first
    const cached = await syncEngine.getCachedSchedule(technicianId, date);
    
    if (cached.length > 0) {
      return cached;
    }

    // If no cache, sync and return
    await syncEngine.syncTechnicianSchedule(date);
    return syncEngine.getCachedSchedule(technicianId, date);
  }
}

// Singleton instance
export const scheduleSync = new ScheduleSync();

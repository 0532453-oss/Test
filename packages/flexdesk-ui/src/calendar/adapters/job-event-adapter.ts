import 'temporal-polyfill/global';
import type { CalendarEventExternal } from '@schedule-x/calendar';
import type { Job, JobUpdateInput } from '@service-flex/types';

/**
 * FlexDesk calendar event type extending Schedule-X's CalendarEventExternal
 * with custom fields for job-specific data.
 */
export interface FlexDeskCalendarEvent extends CalendarEventExternal {
  _customFields: {
    status: string;
    priority: string;
    technicianId?: string | null;
    customerId: string;
  };
}

/**
 * Format a Date or ISO string to 'YYYY-MM-DD'.
 */
function formatDate(date: Date | string): string {
  if (date instanceof Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  // If it's already a string, extract the date portion (YYYY-MM-DD)
  return date.slice(0, 10);
}

/**
 * Normalize a time string to 'HH:mm' format.
 * Accepts 'HH:mm', 'HH:mm:ss', 'H:mm', etc.
 */
function normalizeTime(time: string): string {
  const parts = time.split(':');
  const hours = parts[0].padStart(2, '0');
  const minutes = (parts[1] || '00').padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Convert a FlexDesk Job to a Schedule-X calendar event.
 *
 * Returns null if the job has no scheduled date or start/end times,
 * since Schedule-X requires start and end to render an event.
 *
 * Schedule-X v4 requires Temporal.ZonedDateTime objects for timed events.
 */
export function jobToCalendarEvent(job: Job): FlexDeskCalendarEvent | null {
  if (!job.scheduledDate || !job.scheduledStartTime || !job.scheduledEndTime) {
    return null;
  }

  const dateStr = formatDate(job.scheduledDate);
  const startTime = normalizeTime(job.scheduledStartTime);
  const endTime = normalizeTime(job.scheduledEndTime);

  // Create Temporal.ZonedDateTime objects for Schedule-X v4
  // Use the system's current timezone
  const timeZone = Temporal.Now.timeZoneId();
  const startDateTime = Temporal.PlainDateTime.from(`${dateStr}T${startTime}:00`).toZonedDateTime(timeZone);
  const endDateTime = Temporal.PlainDateTime.from(`${dateStr}T${endTime}:00`).toZonedDateTime(timeZone);

  return {
    id: job.id,
    title: job.title,
    description: job.description ?? undefined,
    start: startDateTime,
    end: endDateTime,
    location: job.address ?? undefined,
    resourceId: job.assignedTechnicianId ?? undefined,
    _customFields: {
      status: job.status,
      priority: job.priority,
      technicianId: job.assignedTechnicianId,
      customerId: job.customerId,
    },
  } as FlexDeskCalendarEvent;
}

/**
 * Convert a Schedule-X calendar event back to a partial JobUpdateInput
 * for persisting reschedule/resize changes to the backend.
 *
 * Extracts scheduledDate, scheduledStartTime, scheduledEndTime, and
 * optionally assignedTechnicianId from the event.
 */
export function calendarEventToJobUpdate(
  event: FlexDeskCalendarEvent,
): Partial<JobUpdateInput> {
  const update: Partial<JobUpdateInput> = {
    id: String(event.id),
  };

  // Handle both Temporal objects and string formats
  const start = event.start;
  const end = event.end;

  if (start && typeof start === 'object' && 'toPlainDate' in start) {
    // Temporal.ZonedDateTime or Temporal.PlainDateTime object
    const temporalDateTime = start as Temporal.ZonedDateTime | Temporal.PlainDateTime;
    update.scheduledDate = temporalDateTime.toPlainDate().toString();
    update.scheduledStartTime = temporalDateTime.toPlainTime().toString().slice(0, 5);
  } else if (start) {
    // Fallback to string parsing
    const startStr = String(start);
    if (startStr.length >= 10) {
      update.scheduledDate = startStr.slice(0, 10);
    }
    if (startStr.length >= 16) {
      update.scheduledStartTime = startStr.slice(11, 16);
    }
  }

  if (end && typeof end === 'object' && 'toPlainTime' in end) {
    // Temporal.ZonedDateTime or Temporal.PlainDateTime object
    const temporalDateTime = end as Temporal.ZonedDateTime | Temporal.PlainDateTime;
    update.scheduledEndTime = temporalDateTime.toPlainTime().toString().slice(0, 5);
  } else if (end) {
    // Fallback to string parsing
    const endStr = String(end);
    if (endStr.length >= 16) {
      update.scheduledEndTime = endStr.slice(11, 16);
    }
  }

  if (event.resourceId) {
    update.assignedTechnicianId = event.resourceId;
  }

  return update;
}

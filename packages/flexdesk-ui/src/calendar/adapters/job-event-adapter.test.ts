import 'temporal-polyfill/global';
import { describe, it, expect } from 'vitest';
import { jobToCalendarEvent, calendarEventToJobUpdate } from './job-event-adapter';
import type { FlexDeskCalendarEvent } from './job-event-adapter';
import type { Job } from '@service-flex/types';

const baseJob: Job = {
  id: 'job-1',
  title: 'Fix plumbing',
  description: 'Repair kitchen sink',
  status: 'SCHEDULED',
  priority: 'HIGH',
  scheduledDate: '2025-03-15',
  scheduledStartTime: '09:00',
  scheduledEndTime: '11:00',
  address: '123 Main St',
  customerId: 'cust-1',
  assignedTechnicianId: 'tech-1',
  workspaceId: 'ws-1',
  syncStatus: 'SYNCED',
  localVersion: 1,
  serverVersion: 1,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('jobToCalendarEvent', () => {
  it('maps a valid job to a calendar event', () => {
    const result = jobToCalendarEvent(baseJob);

    expect(result).not.toBeNull();
    expect(result!.id).toBe('job-1');
    expect(result!.title).toBe('Fix plumbing');
    expect(result!.description).toBe('Repair kitchen sink');
    const start = result!.start as Temporal.ZonedDateTime;
    const end = result!.end as Temporal.ZonedDateTime;
    expect(start.toPlainDate().toString()).toBe('2025-03-15');
    expect(start.toPlainTime().toString().slice(0, 5)).toBe('09:00');
    expect(end.toPlainDate().toString()).toBe('2025-03-15');
    expect(end.toPlainTime().toString().slice(0, 5)).toBe('11:00');
    expect(result!.location).toBe('123 Main St');
    expect(result!.resourceId).toBe('tech-1');
    expect(result!._customFields).toEqual({
      status: 'SCHEDULED',
      priority: 'HIGH',
      technicianId: 'tech-1',
      customerId: 'cust-1',
    });
  });

  it('returns null when scheduledDate is null', () => {
    const job: Job = { ...baseJob, scheduledDate: null };
    expect(jobToCalendarEvent(job)).toBeNull();
  });

  it('returns null when scheduledDate is undefined', () => {
    const job: Job = { ...baseJob, scheduledDate: undefined };
    expect(jobToCalendarEvent(job)).toBeNull();
  });

  it('returns null when scheduledStartTime is null', () => {
    const job: Job = { ...baseJob, scheduledStartTime: null };
    expect(jobToCalendarEvent(job)).toBeNull();
  });

  it('returns null when scheduledEndTime is null', () => {
    const job: Job = { ...baseJob, scheduledEndTime: null };
    expect(jobToCalendarEvent(job)).toBeNull();
  });

  it('handles Date object for scheduledDate', () => {
    const job: Job = { ...baseJob, scheduledDate: new Date(2025, 2, 15) }; // March 15, 2025
    const result = jobToCalendarEvent(job);

    expect(result).not.toBeNull();
    const start = result!.start as Temporal.ZonedDateTime;
    expect(start.toPlainDate().toString()).toBe('2025-03-15');
    expect(start.toPlainTime().toString().slice(0, 5)).toBe('09:00');
  });

  it('handles ISO datetime string for scheduledDate', () => {
    const job: Job = { ...baseJob, scheduledDate: '2025-03-15T00:00:00.000Z' };
    const result = jobToCalendarEvent(job);

    expect(result).not.toBeNull();
    const start = result!.start as Temporal.ZonedDateTime;
    expect(start.toPlainDate().toString()).toBe('2025-03-15');
    expect(start.toPlainTime().toString().slice(0, 5)).toBe('09:00');
  });

  it('handles time with seconds', () => {
    const job: Job = { ...baseJob, scheduledStartTime: '09:30:00', scheduledEndTime: '11:30:00' };
    const result = jobToCalendarEvent(job);

    expect(result).not.toBeNull();
    const start = result!.start as Temporal.ZonedDateTime;
    const end = result!.end as Temporal.ZonedDateTime;
    expect(start.toPlainDate().toString()).toBe('2025-03-15');
    expect(start.toPlainTime().toString().slice(0, 5)).toBe('09:30');
    expect(end.toPlainDate().toString()).toBe('2025-03-15');
    expect(end.toPlainTime().toString().slice(0, 5)).toBe('11:30');
  });

  it('sets resourceId to undefined when no technician assigned', () => {
    const job: Job = { ...baseJob, assignedTechnicianId: null };
    const result = jobToCalendarEvent(job);

    expect(result).not.toBeNull();
    expect(result!.resourceId).toBeUndefined();
    expect(result!._customFields.technicianId).toBeNull();
  });

  it('sets description to undefined when job description is null', () => {
    const job: Job = { ...baseJob, description: null };
    const result = jobToCalendarEvent(job);

    expect(result).not.toBeNull();
    expect(result!.description).toBeUndefined();
  });
});

describe('calendarEventToJobUpdate', () => {
  const baseEvent: FlexDeskCalendarEvent = {
    id: 'job-1',
    title: 'Fix plumbing',
    start: '2025-03-15 09:00',
    end: '2025-03-15 11:00',
    resourceId: 'tech-1',
    _customFields: {
      status: 'SCHEDULED',
      priority: 'HIGH',
      technicianId: 'tech-1',
      customerId: 'cust-1',
    },
  } as FlexDeskCalendarEvent;

  it('maps a calendar event to a job update', () => {
    const result = calendarEventToJobUpdate(baseEvent);

    expect(result.id).toBe('job-1');
    expect(result.scheduledDate).toBe('2025-03-15');
    expect(result.scheduledStartTime).toBe('09:00');
    expect(result.scheduledEndTime).toBe('11:00');
    expect(result.assignedTechnicianId).toBe('tech-1');
  });

  it('omits assignedTechnicianId when resourceId is not set', () => {
    const event: FlexDeskCalendarEvent = {
      ...baseEvent,
      resourceId: undefined,
    } as FlexDeskCalendarEvent;
    const result = calendarEventToJobUpdate(event);

    expect(result.assignedTechnicianId).toBeUndefined();
  });

  it('converts numeric id to string', () => {
    const event: FlexDeskCalendarEvent = {
      ...baseEvent,
      id: 42,
    } as FlexDeskCalendarEvent;
    const result = calendarEventToJobUpdate(event);

    expect(result.id).toBe('42');
  });
});

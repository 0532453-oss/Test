import React, { useCallback } from 'react';
import type { CalendarEventExternal } from '@schedule-x/calendar';
import {
  jobStatusColors,
  jobStatusLabels,
  jobPriorityColors,
  JobStatus,
  JobPriority,
} from '@service-flex/types';
import { useCalendarContext } from '../context/calendar-context';

interface JobCustomFields {
  status: string;
  priority: string;
  technicianId?: string | null;
  customerId: string;
}

interface JobEventCardProps {
  calendarEvent: CalendarEventExternal & {
    _customFields?: JobCustomFields;
  };
}

function formatTime(dateTimeStr: string): string {
  const str = String(dateTimeStr);
  if (str.length >= 16) {
    return str.slice(11, 16);
  }
  return str;
}

/**
 * Custom event card for the time grid (day/week views).
 * Schedule-X drag-and-drop plugin handles the drag functionality.
 */
export function TimeGridJobEventCard({ calendarEvent }: JobEventCardProps) {
  const { title, start, end, _customFields } = calendarEvent;
  const status = (_customFields?.status ?? 'SCHEDULED') as JobStatus;
  const priority = (_customFields?.priority ?? 'MEDIUM') as JobPriority;
  const { jobsById, onEventClick, readOnly } = useCalendarContext();

  const statusColor = jobStatusColors[status] ?? '#3498db';
  const statusLabel = jobStatusLabels[status] ?? status;
  const priorityColor = jobPriorityColors[priority] ?? '#3498db';
  const timeRange = `${formatTime(String(start))} - ${formatTime(String(end))}`;

  const handleClick = useCallback(() => {
    if (onEventClick) {
      const job = jobsById.get(String(calendarEvent.id));
      if (job) {
        onEventClick(job);
      }
    }
  }, [onEventClick, jobsById, calendarEvent.id]);

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        padding: '2px 6px',
        height: '100%',
        overflow: 'hidden',
        fontSize: '11px',
        lineHeight: '1.3',
        color: '#fff',
        borderLeft: `3px solid ${statusColor}`,
        backgroundColor: hexToRgba(statusColor, 0.85),
        borderRadius: '2px',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '10px',
          opacity: 0.9,
        }}
      >
        <span>{timeRange}</span>
        <span
          style={{
            display: 'inline-block',
            padding: '0 4px',
            borderRadius: '3px',
            backgroundColor: hexToRgba(priorityColor, 0.9),
            fontSize: '9px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
          }}
        >
          {priority}
        </span>
      </div>
      <div style={{ fontSize: '10px', opacity: 0.8 }}>{statusLabel}</div>
    </div>
  );
}

/**
 * Custom event card for the date grid (all-day events in week view header)
 * and month grid. Schedule-X drag-and-drop plugin handles drag functionality.
 */
export function DateGridJobEventCard({ calendarEvent }: JobEventCardProps) {
  const { title, _customFields } = calendarEvent;
  const status = (_customFields?.status ?? 'SCHEDULED') as JobStatus;
  const priority = (_customFields?.priority ?? 'MEDIUM') as JobPriority;
  const { jobsById, onEventClick } = useCalendarContext();

  const statusColor = jobStatusColors[status] ?? '#3498db';
  const priorityColor = jobPriorityColors[priority] ?? '#3498db';

  const handleClick = useCallback(() => {
    if (onEventClick) {
      const job = jobsById.get(String(calendarEvent.id));
      if (job) {
        onEventClick(job);
      }
    }
  }, [onEventClick, jobsById, calendarEvent.id]);

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '1px 6px',
        overflow: 'hidden',
        fontSize: '11px',
        lineHeight: '1.4',
        color: '#fff',
        backgroundColor: hexToRgba(statusColor, 0.85),
        borderLeft: `3px solid ${statusColor}`,
        borderRadius: '2px',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <span
        style={{
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}
      >
        {title}
      </span>
      <span
        style={{
          display: 'inline-block',
          padding: '0 3px',
          borderRadius: '3px',
          backgroundColor: hexToRgba(priorityColor, 0.9),
          fontSize: '9px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
          flexShrink: 0,
        }}
      >
        {priority}
      </span>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

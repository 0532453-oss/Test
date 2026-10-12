import 'temporal-polyfill/global';
import '@schedule-x/theme-default/dist/index.css';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScheduleXCalendar, useCalendarApp } from '@schedule-x/react';
import {
  createViewDay,
  createViewWeek,
  createViewMonthGrid,
  createViewMonthAgenda,
} from '@schedule-x/calendar';
import type { CalendarEventExternal } from '@schedule-x/calendar';
import { createEventsServicePlugin } from '@schedule-x/events-service';
import { createCurrentTimePlugin } from '@schedule-x/current-time';
import { createDragAndDropPluginCompat } from './adapters/dnd-plugin-adapter';
import { createResizePlugin } from '@schedule-x/resize';
import type { Job, JobUpdateInput } from '@service-flex/types';

import { jobToCalendarEvent, calendarEventToJobUpdate } from './adapters/job-event-adapter';
import type { FlexDeskCalendarEvent } from './adapters/job-event-adapter';
import { TimeGridJobEventCard, DateGridJobEventCard } from './components/job-event-card';
import { CalendarProvider } from './context/calendar-context';

export type CalendarViewName = 'day' | 'week' | 'month-grid' | 'month-agenda';

export interface FlexDeskCalendarProps {
  events: Job[];
  views?: CalendarViewName[];
  defaultView?: CalendarViewName;
  readOnly?: boolean;
  isLoading?: boolean;
  onEventClick?: (job: Job) => void;
  onEventUpdate?: (updatedJob: Partial<JobUpdateInput>) => void | Promise<void>;
  onEventCreate?: (newEvent: { start: string; end: string; resourceId?: string }) => void;
}

const VIEW_FACTORIES: Record<CalendarViewName, () => ReturnType<typeof createViewDay>> = {
  day: createViewDay,
  week: createViewWeek,
  'month-grid': createViewMonthGrid,
  'month-agenda': createViewMonthAgenda,
};

export function FlexDeskCalendar({
  events,
  views = ['day', 'week', 'month-grid', 'month-agenda'],
  defaultView = 'week',
  readOnly = false,
  isLoading = false,
  onEventClick,
  onEventUpdate,
  onEventCreate,
}: FlexDeskCalendarProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const calendarEvents = useMemo(() => {
    return events
      .map(jobToCalendarEvent)
      .filter((e): e is FlexDeskCalendarEvent => e !== null);
  }, [events]);

  const jobsById = useMemo(() => {
    const map = new Map<string, Job>();
    for (const job of events) {
      map.set(job.id, job);
    }
    return map;
  }, [events]);

  // Create plugins once using useState to ensure stable references
  // This follows the official Schedule-X React pattern
  const [eventsService] = useState(() => createEventsServicePlugin());
  const [currentTimePlugin] = useState(() => createCurrentTimePlugin({ fullWeekWidth: true }));
  const [dragAndDropPlugin] = useState(() => createDragAndDropPluginCompat(15));
  const [resizePlugin] = useState(() => createResizePlugin(15));

  // Build plugins array - always include drag/drop and resize, we'll control via callbacks
  const plugins = useMemo(
    () => [eventsService, currentTimePlugin, dragAndDropPlugin, resizePlugin],
    [eventsService, currentTimePlugin, dragAndDropPlugin, resizePlugin],
  );

  const calendarViews = useMemo(() => {
    return views.map((v) => VIEW_FACTORIES[v]());
  }, [views]);

  const calendarEventsRef = useRef(calendarEvents);
  calendarEventsRef.current = calendarEvents;

  const onEventUpdateRef = useRef(onEventUpdate);
  onEventUpdateRef.current = onEventUpdate;

  const jobsByIdRef = useRef(jobsById);
  jobsByIdRef.current = jobsById;

  const calendarRef = useRef<ReturnType<typeof useCalendarApp>>(null);

  // Store readOnly in a ref so callbacks can access current value
  const readOnlyRef = useRef(readOnly);
  readOnlyRef.current = readOnly;

  // Memoize customComponents to prevent ScheduleXCalendar from calling
  // calendarApp.destroy() + calendarApp.render() on every parent re-render.
  // Without this, the inline object creates a new reference each render,
  // which triggers the useEffect cleanup in ScheduleXCalendar, destroying
  // the calendar and breaking drag-and-drop / resize mid-operation.
  const customComponents = useMemo(
    () => ({
      timeGridEvent: TimeGridJobEventCard,
      dateGridEvent: DateGridJobEventCard,
      monthGridEvent: DateGridJobEventCard,
      monthAgendaEvent: DateGridJobEventCard,
    }),
    [],
  );

  const calendar = useCalendarApp(
    {
      views: calendarViews as [ReturnType<typeof createViewDay>, ...ReturnType<typeof createViewDay>[]],
      events: calendarEvents as CalendarEventExternal[],
      defaultView: defaultView,
      weekOptions: {
        gridStep: 15, // 15-minute snap intervals for drag-and-drop
      },
      callbacks: {
        onEventClick: onEventClick
          ? (event: CalendarEventExternal) => {
              const job = jobsByIdRef.current.get(String(event.id));
              if (job) {
                onEventClick(job);
              }
            }
          : undefined,
        // Handle drag-and-drop and resize updates
        onEventUpdate: (updatedEvent: CalendarEventExternal) => {
          // Block updates in readOnly mode
          if (readOnlyRef.current) return;

          const callback = onEventUpdateRef.current;
          if (!callback) return;

          const originalEvent = calendarEventsRef.current.find(
            (e) => String(e.id) === String(updatedEvent.id),
          );

          const jobUpdate = calendarEventToJobUpdate(updatedEvent as FlexDeskCalendarEvent);

          const result = callback(jobUpdate);
          if (result && typeof result.catch === 'function') {
            result.catch(() => {
              if (originalEvent && calendarRef.current) {
                calendarRef.current.events.update(originalEvent as CalendarEventExternal);
              }
            });
          }
        },
      },
    },
    plugins,
  );

  calendarRef.current = calendar;

  // Update events when they change using the events service
  const isInitialRender = useRef(true);
  useEffect(() => {
    if (!eventsService) return;

    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    // Use the events service to update events
    eventsService.set(calendarEvents as CalendarEventExternal[]);
  }, [eventsService, calendarEvents]);

  return (
    <CalendarProvider
      jobsById={jobsById}
      onEventClick={onEventClick}
      readOnly={readOnly}
    >
      <div
        ref={containerRef}
        style={{ position: 'relative' }}
        className="flexdesk-calendar"
      >
        <ScheduleXCalendar
          calendarApp={calendar}
          customComponents={customComponents}
        />

        {isLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              zIndex: 10,
              borderRadius: '8px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '4px solid #e5e7eb',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'flexdesk-calendar-spin 0.8s linear infinite',
              }}
            />
            <style>{`@keyframes flexdesk-calendar-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </div>
    </CalendarProvider>
  );
}

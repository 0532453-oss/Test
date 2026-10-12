// Schedule-X calendar module entry point
// Re-exports all calendar utilities, plugins, and types for FlexDesk apps

// Core calendar engine
export {
  createCalendar,
  createViewDay,
  createViewWeek,
  createViewMonthGrid,
  createViewMonthAgenda,
} from '@schedule-x/calendar';

export type {
  CalendarEvent,
  CalendarConfig,
  CalendarEventExternal,
} from '@schedule-x/calendar';

// Events service plugin
export { createEventsServicePlugin } from '@schedule-x/events-service';

// Event modal plugin
export { createEventModalPlugin } from '@schedule-x/event-modal';

// Current time indicator plugin
export { createCurrentTimePlugin } from '@schedule-x/current-time';

// Job-to-calendar event adapter
export {
  jobToCalendarEvent,
  calendarEventToJobUpdate,
} from './adapters/job-event-adapter';
export type { FlexDeskCalendarEvent } from './adapters/job-event-adapter';

// FlexDeskCalendar component
export { FlexDeskCalendar } from './flexdesk-calendar';
export type { FlexDeskCalendarProps, CalendarViewName } from './flexdesk-calendar';

// Custom event card components
export { TimeGridJobEventCard, DateGridJobEventCard } from './components/job-event-card';

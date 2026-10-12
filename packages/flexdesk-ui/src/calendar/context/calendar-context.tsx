import React, { createContext, useContext } from 'react';
import type { Job } from '@service-flex/types';

interface CalendarContextValue {
  jobsById: Map<string, Job>;
  onEventClick?: (job: Job) => void;
  readOnly: boolean;
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

export function CalendarProvider({
  children,
  jobsById,
  onEventClick,
  readOnly = false,
}: {
  children: React.ReactNode;
  jobsById: Map<string, Job>;
  onEventClick?: (job: Job) => void;
  readOnly?: boolean;
}) {
  return (
    <CalendarContext.Provider
      value={{
        jobsById,
        onEventClick,
        readOnly,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendarContext() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendarContext must be used within a CalendarProvider');
  }
  return context;
}

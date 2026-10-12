/**
 * Customer Portal Schedule Page - Read-only calendar view
 *
 * Displays the logged-in customer's scheduled jobs in a read-only
 * FlexDeskCalendar (no drag-and-drop, no resize, no drag-to-create).
 * Only Week and Month Grid views are available.
 */

import { useEffect, useState, useCallback } from 'react';
import { FlexDeskCalendar } from 'flexdesk-ui/calendar';
import type { Job } from '@service-flex/types';

export interface PortalSchedulePageProps {
  /** Fetch jobs for the logged-in customer. Called on mount. */
  fetchJobs: () => Promise<Job[]>;
  /** Called when a job event is clicked on the calendar. */
  onJobClick?: (job: Job) => void;
}

export const SchedulePage = ({
  fetchJobs,
  onJobClick,
}: PortalSchedulePageProps) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchJobs();
        if (!cancelled) setJobs(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load schedule.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchJobs]);

  const handleEventClick = useCallback(
    (job: Job) => {
      onJobClick?.(job);
    },
    [onJobClick],
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            My Schedule
          </h1>
          <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Schedule</h1>
        <FlexDeskCalendar
          events={jobs}
          views={['week', 'month-grid']}
          defaultView="week"
          readOnly
          isLoading={loading}
          onEventClick={handleEventClick}
        />
      </div>
    </div>
  );
};

export default SchedulePage;

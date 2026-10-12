/**
 * Technician Schedule Component
 * 
 * Displays technician's schedule for the day
 */

import { useTechnicianSchedule } from '../hooks/useTechnicianSchedule';
import { JobCard } from '@/modules/job/components/JobCard';

interface TechnicianScheduleProps {
  technicianId: string;
  date?: Date;
  className?: string;
}

export function TechnicianSchedule({
  technicianId,
  date = new Date(),
  className = '',
}: TechnicianScheduleProps) {
  const { schedule, loading, error, refetch } = useTechnicianSchedule({
    technicianId,
    date,
  });

  if (loading) {
    return (
      <div className={`${className}`}>
        <p className="text-gray-500">Loading schedule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <p className="text-red-500">Error loading schedule: {error.message}</p>
        <button
          onClick={refetch}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (schedule.length === 0) {
    return (
      <div className={`${className}`}>
        <p className="text-gray-500">No jobs scheduled for this day</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          Schedule for {date.toLocaleDateString()}
        </h2>
        <button
          onClick={refetch}
          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Refresh
        </button>
      </div>

      {schedule.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}

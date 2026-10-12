/**
 * Technician Card Component
 *
 * Displays technician info with optional next job details,
 * countdown timer, and Google Maps directions button.
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  Technician,
  NextJobInfo,
  NextJobResponse,
  hasNextJob,
} from '../types/Technician';

interface TechnicianCardProps {
  technician: Technician;
  nextJob?: NextJobResponse | null;
  onClick?: () => void;
  onGetDirections?: (directionsUrl: string) => void;
  className?: string;
  showNextJob?: boolean;
}

function formatCountdown(minutes: number): string {
  if (minutes < 0) {
    const absMinutes = Math.abs(minutes);
    if (absMinutes >= 60) {
      const hours = Math.floor(absMinutes / 60);
      const mins = absMinutes % 60;
      return `${hours}h ${mins}m overdue`;
    }
    return `${absMinutes}m overdue`;
  }

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
  return `${minutes}m`;
}

function getCountdownColor(minutes: number): string {
  if (minutes < 0) return 'text-red-600';
  if (minutes <= 15) return 'text-orange-600';
  if (minutes <= 30) return 'text-yellow-600';
  return 'text-green-600';
}

export function TechnicianCard({
  technician,
  nextJob,
  onClick,
  onGetDirections,
  className = '',
  showNextJob = true,
}: TechnicianCardProps) {
  const name =
    `${technician.firstName || ''} ${technician.lastName || ''}`.trim() ||
    'Unknown';

  // Live countdown state
  const [currentMinutes, setCurrentMinutes] = useState<number | null>(null);

  const jobInfo: NextJobInfo | null =
    nextJob && 'jobId' in nextJob ? nextJob : null;

  // Update countdown every minute
  useEffect(() => {
    if (!jobInfo) {
      setCurrentMinutes(null);
      return;
    }

    const updateCountdown = () => {
      const scheduledTime = new Date(jobInfo.scheduledAt).getTime();
      const now = Date.now();
      const diffMinutes = Math.round((scheduledTime - now) / (1000 * 60));
      setCurrentMinutes(diffMinutes);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, [jobInfo?.scheduledAt]);

  const handleGetDirections = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (jobInfo?.directionsUrl) {
        if (onGetDirections) {
          onGetDirections(jobInfo.directionsUrl);
        } else {
          window.open(jobInfo.directionsUrl, '_blank', 'noopener,noreferrer');
        }
      }
    },
    [jobInfo?.directionsUrl, onGetDirections],
  );

  const hasJobInProgress =
    nextJob && 'hasJobInProgress' in nextJob && nextJob.hasJobInProgress;

  return (
    <div
      className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow ${className}`}
      onClick={onClick}
    >
      {/* Header: Name + Availability */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
        <div className="flex items-center gap-2">
          {hasJobInProgress && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              In Progress
            </span>
          )}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              technician.isAvailable
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {technician.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>
      </div>

      {technician.phone && (
        <p className="text-sm text-gray-600 mb-2">Phone: {technician.phone}</p>
      )}

      {technician.specialties && technician.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 mb-3">
          {technician.specialties.map((specialty) => (
            <span
              key={specialty}
              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
            >
              {specialty}
            </span>
          ))}
        </div>
      )}

      {/* Next Job Section */}
      {showNextJob && jobInfo && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {/* Next Job Badge */}
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              Next Job
            </span>
            {currentMinutes !== null && (
              <span
                className={`text-sm font-medium ${getCountdownColor(currentMinutes)}`}
              >
                {currentMinutes >= 0 ? 'Starting in ' : ''}
                {formatCountdown(currentMinutes)}
              </span>
            )}
          </div>

          {/* Job Details */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-900">{jobInfo.title}</p>
            <p className="text-sm text-gray-600">{jobInfo.customerName}</p>
            {jobInfo.address && (
              <p className="text-xs text-gray-500 truncate">{jobInfo.address}</p>
            )}
            {jobInfo.travelTimeMinutes !== undefined && (
              <p className="text-xs text-gray-500">
                Travel time: ~{jobInfo.travelTimeMinutes} min
              </p>
            )}
          </div>

          {/* Get Directions Button */}
          {jobInfo.directionsUrl && (
            <button
              type="button"
              onClick={handleGetDirections}
              className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Get Directions
            </button>
          )}
        </div>
      )}

      {/* No Upcoming Jobs Message */}
      {showNextJob && nextJob && !jobInfo && 'message' in nextJob && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-500 italic">{nextJob.message}</p>
        </div>
      )}
    </div>
  );
}

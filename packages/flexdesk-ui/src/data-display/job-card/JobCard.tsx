/**
 * Job Card Component
 * 
 * Displays job information in a card format
 */

import { useNavigate } from 'react-router-dom';
import { JobStatusBadge } from './JobStatusBadge';
import type { Job } from '../types/Job';
import { formatJobDuration, computeJobDuration } from '../utils/computeJobDuration';

interface JobCardProps {
  job: Job;
  onClick?: () => void;
  className?: string;
}

export function JobCard({ job, onClick, className = '' }: JobCardProps) {
  const navigate = useNavigate();
  const duration = computeJobDuration(job.startedAt, job.completedAt);
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/jobs/${job.id}`);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
        <JobStatusBadge status={job.status} />
      </div>

      {job.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{job.description}</p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div>
          {job.scheduledAt && (
            <span>
              Scheduled: {new Date(job.scheduledAt).toLocaleDateString()}
            </span>
          )}
        </div>
        {duration !== null && (
          <span className="font-medium">{formatJobDuration(duration)}</span>
        )}
      </div>
    </div>
  );
}

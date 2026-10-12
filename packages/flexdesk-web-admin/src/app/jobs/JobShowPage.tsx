/**
 * Job Show Page - Job detail view
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useFindOneJob } from '@/app/jobs/hooks/useFindOneJob';
import { useJobStatusTransition } from '@/app/jobs/hooks/useJobStatusTransition';
import { JobStatusBadge } from '@service-flex/components/JobStatusBadge';
import { getNextStatuses } from '@/app/jobs/utils/jobStatusMachine';
import { formatJobDuration, computeJobDuration } from '@/app/jobs/utils/computeJobDuration';
import type { JobStatus } from '@/app/jobs/types/JobStatus';

export const JobShowPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { record: job, loading, error } = useFindOneJob(jobId || '');

  const { transition, isTransitioning, error: transitionError } = useJobStatusTransition({
    jobId: jobId || '',
    currentStatus: job?.status || 'SCHEDULED',
    jobLocation: job?.location || null,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-500">Loading job...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-red-500">
            {error?.message || 'Job not found'}
          </p>
        </div>
      </div>
    );
  }

  const duration = computeJobDuration(job.startedAt, job.completedAt);
  const nextStatuses = getNextStatuses(job.status);

  const handleStatusTransition = async (newStatus: JobStatus) => {
    try {
      await transition(newStatus);
    } catch (err) {
      console.error('Failed to transition status:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <JobStatusBadge status={job.status} />
            </div>
              <button
                onClick={() => navigate(`/jobs/${jobId}/edit`)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Edit Job
              </button>
          </div>

          {job.description && (
            <p className="text-gray-600 mb-4">{job.description}</p>
          )}
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Job Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Priority</dt>
                <dd className="mt-1 text-sm text-gray-900">{job.priority}</dd>
              </div>
              {job.scheduledAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Scheduled At</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(job.scheduledAt).toLocaleString()}
                  </dd>
                </div>
              )}
              {job.startedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Started At</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(job.startedAt).toLocaleString()}
                  </dd>
                </div>
              )}
              {job.completedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Completed At</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(job.completedAt).toLocaleString()}
                  </dd>
                </div>
              )}
              {duration !== null && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Duration</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatJobDuration(duration)}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Location</h2>
            {job.location ? (
              <div>
                {job.location.address && (
                  <p className="text-sm text-gray-900 mb-2">{job.location.address}</p>
                )}
                <p className="text-xs text-gray-500">
                  Coordinates: {job.location.lat.toFixed(6)}, {job.location.lng.toFixed(6)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Location not set</p>
            )}
          </div>
        </div>

        {/* Status Actions */}
        {nextStatuses.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="flex flex-wrap gap-3">
              {nextStatuses.map(({ status, requiresGeofence }) => (
                <button
                  key={status}
                  onClick={() => handleStatusTransition(status)}
                  disabled={isTransitioning}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    isTransitioning
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : status === 'IN_PROGRESS'
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : status === 'COMPLETED'
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  {status === 'IN_PROGRESS' && 'Start Job'}
                  {status === 'COMPLETED' && 'Complete Job'}
                  {status === 'ON_HOLD' && 'Put On Hold'}
                  {status === 'CANCELLED' && 'Cancel Job'}
                  {!['IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'].includes(status) &&
                    status}
                  {requiresGeofence && ' (Requires Location)'}
                </button>
              ))}
            </div>

            {transitionError && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800">{transitionError.message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

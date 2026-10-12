/**
 * Jobs Index Page - List all jobs
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFindManyJobs, useJobFilters } from '@/app/jobs/hooks';
import { JobCard } from '@service-flex/components/JobCard';
import { JobStatusBadge } from '@service-flex/components/JobStatusBadge';
import type { JobStatus, JobPriority } from '@/app/jobs/types/JobStatus';

export const JobsIndexPage = () => {
  const { filters, setStatus, setPriority, clearFilters } = useJobFilters();
  const { records: jobs, loading, error, fetchMore, hasMore } = useFindManyJobs({
    filter: filters,
    limit: 20,
    onCompleted: undefined,
    onError: undefined,
  });

  const [selectedStatus, setSelectedStatus] = useState<JobStatus | ''>('');
  const [selectedPriority, setSelectedPriority] = useState<JobPriority | ''>('');

  const handleStatusChange = (status: JobStatus | '') => {
    setSelectedStatus(status);
    setStatus(status || undefined);
  };

  const handlePriorityChange = (priority: JobPriority | '') => {
    setSelectedPriority(priority);
    setPriority(priority || undefined);
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-gray-500">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-red-500">Error loading jobs: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
            <button
              onClick={() => navigate('/jobs/create')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              + Create Job
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value as JobStatus | '')}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={selectedPriority}
                onChange={(e) => handlePriorityChange(e.target.value as JobPriority | '')}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {(selectedStatus || selectedPriority) && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Jobs Grid */}
        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No jobs found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClick={() => navigate(`/jobs/${job.id}`)}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={() => fetchMore()}
              disabled={loading}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

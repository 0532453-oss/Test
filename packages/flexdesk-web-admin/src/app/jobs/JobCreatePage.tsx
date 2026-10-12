/**
 * Job Create Page
 */

import { useState } from 'react';
import { useCreateJob } from '@/app/jobs/hooks/useCreateJob';
import { useNavigate } from 'react-router-dom';
import type { JobPriority } from '@/app/jobs/types/JobStatus';

export const JobCreatePage = () => {
  const { createRecord: createJob, loading, error } = useCreateJob();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as JobPriority,
    customerId: '',
    scheduledAt: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Parse datetime-local into separate date and time fields
      let scheduledDate: string | undefined;
      let scheduledStartTime: string | undefined;
      let scheduledEndTime: string | undefined;

      if (formData.scheduledAt) {
        const [date, time] = formData.scheduledAt.split('T');
        scheduledDate = date;
        scheduledStartTime = time;
        // Default end time to 1 hour after start
        const [hours, minutes] = time.split(':').map(Number);
        const endHour = (hours + 1) % 24;
        scheduledEndTime = `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }

      const job = await createJob({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        customerId: formData.customerId,
        scheduledAt: formData.scheduledAt || undefined,
        scheduledDate,
        scheduledStartTime,
        scheduledEndTime,
        status: 'SCHEDULED',
      });

      // Navigate to job detail page
      navigate(`/jobs/${job.id}`);
    } catch (err) {
      console.error('Failed to create job:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Job</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as JobPriority })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer ID *
              </label>
              <input
                type="text"
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scheduled At
              </label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800">{error.message}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
              >
                {loading ? 'Creating...' : 'Create Job'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/**
 * Schedule Page - Admin calendar view using FlexDeskCalendar
 *
 * Uses the web-admin data layer (useFindManyRecords via @service-flex/core)
 * instead of React Admin hooks.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFindManyJobs } from '../jobs/hooks/useFindManyJobs';
import { useFindManyTechnicians } from './hooks/useFindManyTechnicians';
import { apiClient } from '@service-flex/core';
import { FlexDeskCalendar } from 'flexdesk-ui/calendar';
import type { Job, JobUpdateInput } from '@service-flex/types';

export const SchedulePage = () => {
  const navigate = useNavigate();
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch all jobs with SCHEDULED status
  const {
    records: allJobs,
    loading: jobsLoading,
    refetch: refetchJobs,
  } = useFindManyJobs({
    filter: { status: 'SCHEDULED' as any },
    limit: 200,
  });

  // Split jobs into scheduled (have date/time) and unscheduled (no date/time)
  const jobs = allJobs.filter(
    (job) => job.scheduledDate && job.scheduledStartTime && job.scheduledEndTime
  );
  const unscheduledJobs = allJobs.filter(
    (job) => !job.scheduledDate || !job.scheduledStartTime || !job.scheduledEndTime
  );
  const unscheduledLoading = jobsLoading;
  const refetchUnscheduled = refetchJobs;

  // Fetch active technicians for resource view
  const { records: technicians } = useFindManyTechnicians({
    filter: { isActive: true },
  });

  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleEventClick = useCallback((job: Job) => {
    navigate(`/jobs/${job.id}`);
  }, [navigate]);

  const handleEventUpdate = useCallback(async (updatedJob: Partial<JobUpdateInput>) => {
    if (!updatedJob.id) return;
    try {
      await apiClient.put(`/jobs/${updatedJob.id}`, {
        scheduledDate: updatedJob.scheduledDate,
        scheduledStartTime: updatedJob.scheduledStartTime,
        scheduledEndTime: updatedJob.scheduledEndTime,
        assignedTechnicianId: updatedJob.assignedTechnicianId,
      });
      showNotification('Job rescheduled', 'success');
      refetchJobs();
    } catch (error) {
      showNotification('Failed to reschedule job', 'error');
      // Re-throw so FlexDeskCalendar can revert the event to its original position
      throw error;
    }
  }, [refetchJobs, showNotification]);

  const handleEventCreate = useCallback((newEvent: { start: string; end: string; resourceId?: string }) => {
    const params = new URLSearchParams({
      scheduledDate: newEvent.start.slice(0, 10),
      scheduledStartTime: newEvent.start.slice(11, 16),
      scheduledEndTime: newEvent.end.slice(11, 16),
    });
    if (newEvent.resourceId) {
      params.set('assignedTechnicianId', newEvent.resourceId);
    }
    navigate(`/jobs/create?${params.toString()}`);
  }, [navigate]);

  const handleScheduleJob = useCallback(async (
    job: Job,
    schedule: { scheduledDate: string; scheduledStartTime: string; scheduledEndTime: string; assignedTechnicianId?: string },
  ) => {
    try {
      await apiClient.put(`/jobs/${job.id}`, {
        ...schedule,
        status: 'SCHEDULED',
      });
      showNotification('Job scheduled successfully', 'success');
      refetchJobs();
      refetchUnscheduled();
    } catch (error) {
      showNotification('Failed to schedule job', 'error');
    }
  }, [refetchJobs, refetchUnscheduled, showNotification]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
              notification.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* Main layout: calendar + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-9">
            <FlexDeskCalendar
              events={jobs}
              views={['day', 'week', 'month-grid', 'month-agenda']}
              defaultView="week"
              isLoading={jobsLoading}
              onEventClick={handleEventClick}
              onEventUpdate={handleEventUpdate}
              onEventCreate={handleEventCreate}
            />
          </div>

          {/* Unscheduled Jobs Sidebar */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Unscheduled Jobs</h2>
              </div>
              <div className="p-4 h-[600px] overflow-auto">
                {unscheduledLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="p-3 rounded-lg border border-gray-200 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : unscheduledJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">All jobs scheduled!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {unscheduledJobs.map((job) => (
                      <div
                        key={job.id}
                        className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                      >
                        <button
                          onClick={() => navigate(`/jobs/${job.id}`)}
                          className="w-full text-left"
                        >
                          <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                                job.priority === 'URGENT'
                                  ? 'bg-red-100 text-red-800'
                                  : job.priority === 'HIGH'
                                    ? 'bg-orange-100 text-orange-800'
                                    : job.priority === 'MEDIUM'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {job.priority}
                            </span>
                            {(job as any).estimatedDuration && (
                              <span className="text-xs text-gray-500">
                                {Math.floor((job as any).estimatedDuration / 60)}h {(job as any).estimatedDuration % 60}m
                              </span>
                            )}
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            const now = new Date();
                            const startHour = now.getHours();
                            const startMin = now.getMinutes() < 30 ? '00' : '30';
                            const endHour = startHour + 1;
                            const scheduledDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                            handleScheduleJob(job, {
                              scheduledDate,
                              scheduledStartTime: `${String(startHour).padStart(2, '0')}:${startMin}`,
                              scheduledEndTime: `${String(endHour).padStart(2, '0')}:${startMin}`,
                            });
                          }}
                          className="mt-2 w-full px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition"
                        >
                          Schedule Now
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;

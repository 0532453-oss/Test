import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { apiClient } from '@/modules/api/client/apiClient';
import type { Job } from '@/modules/job/types/Job';
import { JobMap } from '@/modules/technician/components/JobMap';

interface PublicTechnicianInfo {
  id: string;
  name: string;
  currentLocation: {
    lat: number;
    lng: number;
    updatedAt?: string;
  } | null;
}

interface PublicTrackingResponse {
  job: Job | null;
  technician: PublicTechnicianInfo | null;
}

export const TrackTechnicianPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [data, setData] = useState<PublicTrackingResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError('Missing tracking token.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<PublicTrackingResponse>(
          `/api/public/track`,
          {
            params: { token },
          },
        );
        setData(response.data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load tracking data.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-gray-500">Loading tracking view…</p>
        </div>
      </div>
    );
  }

  if (error || !data || !data.job) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg bg-white shadow-sm border border-gray-200 p-4">
            <h1 className="text-lg font-semibold text-gray-900 mb-2">
              Tracking link unavailable
            </h1>
            <p className="text-sm text-gray-600">
              {error ??
                'This tracking link is invalid, expired, or the job is no longer available.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { job, technician } = data;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Tracking your technician
              </h1>
              <p className="text-xs text-gray-500">
                Job: {job.title} · Status: {job.status}
              </p>
            </div>
            {technician && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {technician.name}
                </p>
                {technician.currentLocation?.updatedAt && (
                  <p className="text-[11px] text-gray-500">
                    Last updated{' '}
                    {new Date(
                      technician.currentLocation.updatedAt,
                    ).toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Job details</h2>
            <p className="mt-1 text-xs text-gray-500">
              Address and schedule are shared so you can plan your day.
            </p>
            <div className="mt-3 space-y-1 text-sm text-gray-700">
              <p className="font-medium">{job.title}</p>
              {job.location?.address && <p>{job.location.address}</p>}
              {job.scheduledAt && (
                <p>
                  Scheduled for{' '}
                  {new Date(job.scheduledAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">
              Today&apos;s route
            </h2>
            <JobMap jobs={[job]} date={new Date()} />
          </div>
        </div>
      </div>
    </div>
  );
};


import React from 'react';
import { useJobGeofence } from '../../hooks/useJobGeofence';
import type { JobLocation } from '../types/Job';

interface GeofenceIndicatorProps {
  jobId: string;
  jobLocation: JobLocation | null;
  technicianLocation?: { lat: number; lng: number } | null;
}

export function GeofenceIndicator({ jobId, jobLocation, technicianLocation }: GeofenceIndicatorProps) {
  const { isValid, distance, isWithinRadius, message } = useJobGeofence({
    jobId,
    jobLocation,
    technicianLocation,
    pollInterval: 5000,
  });

  if (!jobLocation) {
    return (
      <div className="p-3 bg-yellow-50 rounded-lg">
        <p className="text-sm text-yellow-800">Job location not set</p>
      </div>
    );
  }

  return (
    <div
      className={`p-3 rounded-lg ${
        isWithinRadius ? 'bg-green-50' : 'bg-red-50'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {isWithinRadius ? '✓ Within range' : '✗ Out of range'}
        </span>
        <span className={`text-lg font-bold ${
          isWithinRadius ? 'text-green-600' : 'text-red-600'
        }`}>
          {distance !== null ? `${distance}m` : '...'}
        </span>
      </div>
      {message && <p className="text-xs mt-1">{message}</p>}
    </div>
  );
}

/**
 * Hook for job status transitions with geofencing validation
 * 
 * Handles state machine transitions and validates geofence when required
 */

import { useState, useCallback } from 'react';
import { apiClient, type OptimisticUpdate } from '@/modules/api/client/apiClient';
import { isValidTransition, requiresGeofence } from '@/app/jobs/utils/jobStatusMachine';
import { validateJobGeofence, GeofenceError } from '@/app/jobs/utils/geofenceValidator';
import { useCurrentTechnician } from '@/modules/technician/hooks/useCurrentTechnician';
import { useInvoiceGeneration } from '@/app/invoices/hooks/useInvoiceGeneration';
import type { JobStatus } from '../types/JobStatus';
import type { Job } from '../types/Job';

export interface UseJobStatusTransitionOptions {
  jobId: string;
  currentStatus: JobStatus;
  jobLocation?: { lat: number; lng: number } | null;
}

export function useJobStatusTransition(options: UseJobStatusTransitionOptions) {
  const { jobId, currentStatus, jobLocation } = options;
  const { technician } = useCurrentTechnician();
  const technicianLocation = technician?.currentLocation || null;
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const transition = useCallback(
    async (newStatus: JobStatus) => {
      // Validate transition is allowed
      if (!isValidTransition(currentStatus, newStatus)) {
        const error = new Error(
          `Invalid transition from ${currentStatus} to ${newStatus}`
        );
        setError(error);
        throw error;
      }

      // Check if geofencing is required
      if (requiresGeofence(currentStatus, newStatus)) {
        if (!jobLocation) {
          const error = new Error('Job location not set. Cannot check in.');
          setError(error);
          throw error;
        }

        if (!technicianLocation) {
          const error = new Error('Technician location not available. Please enable GPS.');
          setError(error);
          throw error;
        }

        // Validate geofence
        const geofenceResult = await validateJobGeofence(
          jobLocation,
          { lat: technicianLocation.lat, lng: technicianLocation.lng }
        );

        if (!geofenceResult.valid) {
          const geofenceError = new GeofenceError(
            geofenceResult.distance,
            500,
            geofenceResult.message
          );
          setError(geofenceError);
          throw geofenceError;
        }
      }

      setIsTransitioning(true);
      setError(null);

      try {
        // Optimistic update
        const optimisticUpdate: OptimisticUpdate<Job> = {
          update: (current) => {
            if (!current) {
              throw new Error('Job not found');
            }
            return {
              ...current,
              status: newStatus,
              startedAt: newStatus === 'IN_PROGRESS' ? new Date().toISOString() : current.startedAt,
              completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : current.completedAt,
              updatedAt: new Date().toISOString(),
            };
          },
          entityType: 'Job',
          entityId: jobId,
        };

        // Make API call
        const response = await apiClient.patch<Job>(
          `/api/jobs/${jobId}/status`,
          { status: newStatus },
          { optimistic: optimisticUpdate }
        );

        // If transitioning to COMPLETED, auto-generate invoice
        if (newStatus === 'COMPLETED' && response.data) {
          try {
            await generateInvoiceFromJob(response.data);
          } catch (invoiceError) {
            console.error('Failed to generate invoice:', invoiceError);
            // Don't throw - invoice generation failure shouldn't block status transition
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to transition job status');
        setError(error);
        throw error;
      } finally {
        setIsTransitioning(false);
      }
    },
    [jobId, currentStatus, jobLocation, technicianLocation, generateInvoiceFromJob]
  );

  return {
    transition,
    isTransitioning,
    error,
    canTransition: (to: JobStatus) => isValidTransition(currentStatus, to),
    requiresGeofence: (to: JobStatus) => requiresGeofence(currentStatus, to),
  };
}

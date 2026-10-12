/**
 * Hook to check geofence status for a job
 * 
 * Provides real-time geofence validation and distance calculation
 */

import { useState, useEffect } from 'react';
import {
  validateJobGeofence,
  calculateDistance,
  type Location,
  type GeofenceValidationResult,
} from '@/app/jobs/utils/geofenceValidator';
import { useCurrentTechnician } from '@/modules/technician/hooks/useCurrentTechnician';

export interface UseJobGeofenceOptions {
  jobId: string;
  jobLocation: Location | null;
  radiusMeters?: number;
  pollInterval?: number; // Poll interval in milliseconds
}

export function useJobGeofence(options: UseJobGeofenceOptions) {
  const { jobId, jobLocation, radiusMeters = 500, pollInterval = 5000 } = options;
  const { technician } = useCurrentTechnician();
  const technicianLocation = technician?.currentLocation || null;
  
  const [validation, setValidation] = useState<GeofenceValidationResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (!jobLocation || !technicianLocation) {
      setValidation(null);
      return;
    }

    const checkGeofence = async () => {
      setIsChecking(true);
      try {
        const result = await validateJobGeofence(
          jobLocation,
          { lat: technicianLocation.lat, lng: technicianLocation.lng },
          radiusMeters
        );
        setValidation(result);
      } catch (error) {
        console.error('Geofence validation error:', error);
        setValidation({
          valid: false,
          distance: 0,
          message: 'Failed to validate geofence',
        });
      } finally {
        setIsChecking(false);
      }
    };

    // Initial check
    checkGeofence();

    // Set up polling if interval is provided
    if (pollInterval > 0) {
      const interval = setInterval(checkGeofence, pollInterval);
      return () => clearInterval(interval);
    }
  }, [jobLocation, technicianLocation, radiusMeters, pollInterval]);

  // Calculate distance even if validation hasn't run
  const distance = jobLocation && technicianLocation
    ? calculateDistance(jobLocation, { lat: technicianLocation.lat, lng: technicianLocation.lng })
    : null;

  return {
    isValid: validation?.valid ?? false,
    distance: distance ?? validation?.distance ?? null,
    message: validation?.message,
    isChecking,
    isWithinRadius: distance !== null ? distance <= radiusMeters : false,
  };
}

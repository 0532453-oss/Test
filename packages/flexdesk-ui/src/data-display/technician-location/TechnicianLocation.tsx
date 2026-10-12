/**
 * Technician Location Component
 * 
 * Displays technician's current location on a map
 */

import { useTechnicianLocation } from '../hooks/useTechnicianLocation';
import type { Technician } from '../types/Technician';

interface TechnicianLocationProps {
  technician: Technician;
  showMap?: boolean;
  className?: string;
}

export function TechnicianLocation({
  technician,
  showMap = false,
  className = '',
}: TechnicianLocationProps) {
  const { location, isTracking, startTracking, stopTracking } = useTechnicianLocation({
    technicianId: technician.id,
    enableTracking: true,
  });

  const displayLocation = location || technician.currentLocation;

  if (!displayLocation) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        <p>Location not available</p>
        <button
          onClick={startTracking}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Start Tracking
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">
          Last updated: {new Date(displayLocation.updatedAt).toLocaleTimeString()}
        </p>
        {isTracking ? (
          <button
            onClick={stopTracking}
            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
          >
            Stop Tracking
          </button>
        ) : (
          <button
            onClick={startTracking}
            className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
          >
            Start Tracking
          </button>
        )}
      </div>

      {showMap && (
        <div className="mt-2 h-48 bg-gray-200 rounded">
          {/* Map integration would go here */}
          <p className="text-center text-gray-500 pt-20">
            Map: {displayLocation.lat.toFixed(6)}, {displayLocation.lng.toFixed(6)}
          </p>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-2">
        Coordinates: {displayLocation.lat.toFixed(6)}, {displayLocation.lng.toFixed(6)}
      </p>
    </div>
  );
}

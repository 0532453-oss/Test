/**
 * Technician Job Map Component
 *
 * Displays multiple job locations on a Google Map with:
 * - Numbered markers in scheduled order
 * - Distinct styling for the next job (star icon, larger marker)
 * - Route polyline visualization
 * - Auto-focus on next job with ETA overlay
 * - Technician current location marker
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Job, JobStatus } from '../types/Job';

interface TechnicianLocation {
  lat: number;
  lng: number;
}

interface TechnicianJobMapProps {
  jobs: Job[];
  date: Date;
  technicianLocation?: TechnicianLocation | null;
  nextJobId?: string | null;
  focusOnNextJob?: boolean;
  showRouteVisualization?: boolean;
  travelTimeMinutes?: number;
  className?: string;
}

declare global {
  interface Window {
    google?: typeof google;
  }
}

function sortJobsByScheduledAt(jobs: Job[]): Job[] {
  return [...jobs].sort((a, b) => {
    if (!a.scheduledAt && !b.scheduledAt) return 0;
    if (!a.scheduledAt) return 1;
    if (!b.scheduledAt) return -1;
    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
  });
}

function findNextJob(jobs: Job[]): Job | null {
  const now = new Date();
  const sortedJobs = sortJobsByScheduledAt(jobs);

  // Find first job that's scheduled/dispatched and not past
  for (const job of sortedJobs) {
    if (
      (job.status === 'SCHEDULED' || job.status === 'DISPATCHED') &&
      job.scheduledAt &&
      new Date(job.scheduledAt) >= now
    ) {
      return job;
    }
  }

  // Fallback: find any scheduled/dispatched job today
  for (const job of sortedJobs) {
    if (job.status === 'SCHEDULED' || job.status === 'DISPATCHED') {
      return job;
    }
  }

  return null;
}

export function TechnicianJobMap({
  jobs,
  date,
  technicianLocation,
  nextJobId,
  focusOnNextJob = true,
  showRouteVisualization = true,
  travelTimeMinutes,
  className = '',
}: TechnicianJobMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  const points = useMemo(
    () =>
      sortJobsByScheduledAt(jobs)
        .map((job) => {
          if (
            !job.location ||
            typeof job.location.lat !== 'number' ||
            typeof job.location.lng !== 'number'
          ) {
            return null;
          }
          return {
            id: job.id,
            title: job.title,
            status: job.status,
            scheduledAt: job.scheduledAt ?? undefined,
            lat: job.location.lat,
            lng: job.location.lng,
          };
        })
        .filter(
          (
            p,
          ): p is {
            id: string;
            title: string;
            status: JobStatus;
            scheduledAt?: string;
            lat: number;
            lng: number;
          } => p !== null,
        ),
    [jobs],
  );

  // Determine next job (either passed in or auto-detected)
  const effectiveNextJobId = useMemo(() => {
    if (nextJobId) return nextJobId;
    const nextJob = findNextJob(jobs);
    return nextJob?.id ?? null;
  }, [nextJobId, jobs]);

  useEffect(() => {
    if (!mapRef.current || !window.google || points.length === 0) {
      return;
    }

    const nextJobPoint = points.find((p) => p.id === effectiveNextJobId);
    const centerPoint = focusOnNextJob && nextJobPoint ? nextJobPoint : points[0];

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: centerPoint.lat, lng: centerPoint.lng },
      zoom: focusOnNextJob && nextJobPoint ? 14 : 12,
    });

    setMapInstance(map);

    const bounds = new window.google.maps.LatLngBounds();

    // Add technician location marker
    if (
      technicianLocation?.lat &&
      technicianLocation?.lng &&
      !isNaN(technicianLocation.lat) &&
      !isNaN(technicianLocation.lng)
    ) {
      const techPosition = {
        lat: technicianLocation.lat,
        lng: technicianLocation.lng,
      };
      bounds.extend(techPosition);

      new window.google.maps.Marker({
        position: techPosition,
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: '#047857',
          strokeWeight: 2,
        },
        title: 'Current Location',
        zIndex: 1000,
      });
    }

    // Add job markers
    points.forEach((point, index) => {
      const position = { lat: point.lat, lng: point.lng };
      bounds.extend(position);

      const isNextJob = point.id === effectiveNextJobId;
      const isInProgress = point.status === 'IN_PROGRESS';

      // Different marker styles based on job type
      let markerOptions: google.maps.MarkerOptions = {
        position,
        map,
        title: point.scheduledAt
          ? `${point.title} - ${new Date(point.scheduledAt).toLocaleTimeString()}`
          : point.title,
      };

      if (isNextJob) {
        // Next job: Star marker, larger, gold color
        markerOptions = {
          ...markerOptions,
          icon: {
            path: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
            scale: 1.5,
            fillColor: '#F59E0B',
            fillOpacity: 1,
            strokeColor: '#D97706',
            strokeWeight: 2,
            anchor: new window.google.maps.Point(12, 12),
          },
          zIndex: 999,
          animation: window.google.maps.Animation.BOUNCE,
        };

        // Stop bouncing after 2 seconds
        setTimeout(() => {
          // Marker animation will stop naturally
        }, 2000);
      } else if (isInProgress) {
        // In progress: Orange pulse marker
        markerOptions = {
          ...markerOptions,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#F97316',
            fillOpacity: 1,
            strokeColor: '#EA580C',
            strokeWeight: 3,
          },
          label: {
            text: `${index + 1}`,
            color: '#FFFFFF',
            fontWeight: 'bold',
          },
          zIndex: 998,
        };
      } else {
        // Regular job marker
        markerOptions = {
          ...markerOptions,
          label: {
            text: `${index + 1}`,
            color: '#FFFFFF',
            fontWeight: 'bold',
          },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#1D4ED8',
            strokeWeight: 2,
          },
        };
      }

      const marker = new window.google.maps.Marker(markerOptions);

      // Add info window for next job with ETA
      if (isNextJob && travelTimeMinutes !== undefined) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 150px;">
              <h3 style="margin: 0 0 4px 0; font-weight: bold; font-size: 14px;">Next Job</h3>
              <p style="margin: 0 0 4px 0; font-size: 12px;">${point.title}</p>
              <p style="margin: 0; font-size: 12px; color: #6B7280;">
                ETA: ~${travelTimeMinutes} min drive
              </p>
            </div>
          `,
        });
        infoWindow.open(map, marker);
      }
    });

    // Fit bounds unless focusing on next job
    if (!focusOnNextJob && points.length > 1) {
      map.fitBounds(bounds);
    }

    // Draw route visualization
    if (showRouteVisualization && points.length > 1) {
      // If technician location exists, start route from there
      const routePoints =
        technicianLocation?.lat && technicianLocation?.lng
          ? [
              { lat: technicianLocation.lat, lng: technicianLocation.lng },
              ...points.map((p) => ({ lat: p.lat, lng: p.lng })),
            ]
          : points.map((p) => ({ lat: p.lat, lng: p.lng }));

      new window.google.maps.Polyline({
        path: routePoints,
        geodesic: true,
        strokeColor: '#2563eb',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map,
        icons: [
          {
            icon: {
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 3,
              strokeColor: '#1D4ED8',
            },
            offset: '50%',
          },
        ],
      });

      // Highlight path to next job in a different color
      if (effectiveNextJobId && technicianLocation?.lat && technicianLocation?.lng) {
        const nextJobPoint = points.find((p) => p.id === effectiveNextJobId);
        if (nextJobPoint) {
          new window.google.maps.Polyline({
            path: [
              { lat: technicianLocation.lat, lng: technicianLocation.lng },
              { lat: nextJobPoint.lat, lng: nextJobPoint.lng },
            ],
            geodesic: true,
            strokeColor: '#F59E0B',
            strokeOpacity: 1,
            strokeWeight: 4,
            map,
            zIndex: 100,
          });
        }
      }
    }
  }, [
    points,
    date,
    technicianLocation,
    effectiveNextJobId,
    focusOnNextJob,
    showRouteVisualization,
    travelTimeMinutes,
  ]);

  if (points.length === 0) {
    return (
      <div className={`flex items-center justify-center h-72 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
        <p className="text-sm text-gray-500">
          No jobs with valid map locations for this day.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-72 rounded-lg border border-gray-100" />

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-white rounded-lg shadow-sm p-2 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full bg-yellow-500 border border-yellow-600" />
          <span>Next Job</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full bg-orange-500 border border-orange-600" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full bg-blue-500 border border-blue-700" />
          <span>Scheduled</span>
        </div>
        {technicianLocation && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 border border-green-700" />
            <span>Your Location</span>
          </div>
        )}
      </div>

      {/* ETA Overlay */}
      {travelTimeMinutes !== undefined && effectiveNextJobId && (
        <div className="absolute top-2 right-2 bg-white rounded-lg shadow-sm px-3 py-2">
          <p className="text-xs text-gray-500">ETA to next job</p>
          <p className="text-lg font-semibold text-indigo-600">
            ~{travelTimeMinutes} min
          </p>
        </div>
      )}
    </div>
  );
}

// Backward compatible export with original name
export { TechnicianJobMap as JobMap };

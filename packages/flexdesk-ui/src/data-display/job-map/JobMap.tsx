import { useEffect, useRef } from 'react';
import type { JobLocation } from '../types/Job';

interface JobMapProps {
  location: JobLocation;
  className?: string;
}

export function JobMap({ location, className = '' }: JobMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: location.lat, lng: location.lng },
      zoom: 15,
    });

    new window.google.maps.Marker({
      position: { lat: location.lat, lng: location.lng },
      map,
      title: location.address || 'Job Location',
    });
  }, [location]);

  return <div ref={mapRef} className={`w-full h-64 rounded-lg ${className}`} />;
}

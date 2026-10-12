import { useEffect, useRef } from 'react';
import type { TechnicianLocation } from '../types/Technician';

interface TechnicianLocationMapProps {
  location: TechnicianLocation;
  className?: string;
}

export function TechnicianLocationMap({ location, className = '' }: TechnicianLocationMapProps) {
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
      title: 'Your Location',
    });
  }, [location]);

  return <div ref={mapRef} className={`w-full h-64 rounded-lg ${className}`} />;
}

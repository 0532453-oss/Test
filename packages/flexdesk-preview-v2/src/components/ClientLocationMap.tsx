/**
 * Client Location Map Component
 *
 * Displays a client's address on a Google Map with a marker.
 * Dynamically loads Google Maps API and falls back to geocoding
 * the address if lat/lng coordinates aren't available.
 */

import { useEffect, useRef, useState } from 'react';
import { Text, Icon, Spinner, Button } from '@/atlantis';

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  lat?: number;
  lng?: number;
}

interface ClientLocationMapProps {
  address: Address;
  clientName?: string;
  className?: string;
}

// Simple Google Maps types for TypeScript (avoid @types/google.maps dependency)
interface GoogleMapsGlobal {
  maps: {
    Map: new (element: HTMLElement, options: any) => any;
    Marker: new (options: any) => any;
    InfoWindow: new (options: any) => any;
    Geocoder: new () => {
      geocode: (request: any, callback: (results: any[] | null, status: string) => void) => void;
    };
    SymbolPath: {
      CIRCLE: number;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleMapsGlobal;
    initGoogleMaps?: () => void;
  }
}

// Track if we're already loading the script
let isLoadingScript = false;
let isScriptLoaded = false;
const loadCallbacks: (() => void)[] = [];

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (window.google?.maps) {
      isScriptLoaded = true;
      resolve();
      return;
    }

    // Add callback to queue
    loadCallbacks.push(() => resolve());

    // If already loading, just wait
    if (isLoadingScript) {
      return;
    }

    // No API key
    if (!apiKey) {
      reject(new Error('No Google Maps API key'));
      return;
    }

    isLoadingScript = true;

    // Create callback function
    window.initGoogleMaps = () => {
      isScriptLoaded = true;
      isLoadingScript = false;
      loadCallbacks.forEach(cb => cb());
      loadCallbacks.length = 0;
    };

    // Load script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      isLoadingScript = false;
      reject(new Error('Failed to load Google Maps'));
    };
    document.head.appendChild(script);
  });
}

export function ClientLocationMap({
  address,
  clientName = 'Client Location',
  className = ''
}: ClientLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(isScriptLoaded);

  // Build full address string for geocoding and directions
  const fullAddress = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`;

  // Google Maps directions URL
  const directionsUrl = coordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}&travelmode=driving`;

  // Load Google Maps script
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setMapError('Google Maps API key not configured');
      setIsLoading(false);
      return;
    }

    loadGoogleMapsScript(apiKey)
      .then(() => {
        setMapsLoaded(true);
        setIsLoading(false);
      })
      .catch((err) => {
        setMapError(err.message || 'Failed to load Google Maps');
        setIsLoading(false);
      });
  }, []);

  // Set coordinates from address or geocode
  useEffect(() => {
    if (address.lat && address.lng && !isNaN(address.lat) && !isNaN(address.lng)) {
      setCoordinates({ lat: address.lat, lng: address.lng });
    } else if (mapsLoaded && window.google?.maps?.Geocoder) {
      // Try to geocode the address
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: fullAddress }, (results, status) => {
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          const location = results[0].geometry.location;
          setCoordinates({ lat: location.lat(), lng: location.lng() });
        }
      });
    }
  }, [address, mapsLoaded, fullAddress]);

  // Initialize map when coordinates are available
  useEffect(() => {
    if (!mapRef.current || !mapsLoaded || !window.google || !coordinates) {
      return;
    }

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center: coordinates,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      // Add marker for client location
      const marker = new window.google.maps.Marker({
        position: coordinates,
        map,
        title: clientName,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#4F46E5',
          fillOpacity: 1,
          strokeColor: '#3730A3',
          strokeWeight: 2,
        },
      });

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 4px 0; font-weight: bold; font-size: 14px;">${clientName}</h3>
            <p style="margin: 0; font-size: 12px; color: #6B7280;">${fullAddress}</p>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      // Open info window by default
      infoWindow.open(map, marker);

      setMapError(null);
    } catch {
      setMapError('Failed to initialize map');
    }
  }, [coordinates, clientName, fullAddress, mapsLoaded]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-[var(--color-surface--background)] rounded-lg p-6 flex items-center justify-center ${className}`}>
        <Spinner size="small" />
        <Text element="span" variation="subdued" size="small" className="ml-2">Loading map...</Text>
      </div>
    );
  }

  // Error state - show fallback with external link
  if (mapError || !mapsLoaded) {
    return (
      <div className={`bg-[var(--color-surface--background)] rounded-lg p-4 text-center ${className}`}>
        <Icon name="address" size="large" className="mx-auto mb-2 text-gray-500" />
        <Text variation="subdued" size="small" className="mb-3">
          {mapError || 'Map not available'}
        </Text>
        <Button type="secondary" variation="work" size="small" icon="external" url={directionsUrl} external>
          Open in Google Maps
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        ref={mapRef}
        className="w-full h-48 rounded-lg border border-gray-200 dark:border-gray-700"
      />
      <Button type="secondary" variation="work" size="small" icon="external" fullWidth url={directionsUrl} external>
        Get Directions
      </Button>
    </div>
  );
}

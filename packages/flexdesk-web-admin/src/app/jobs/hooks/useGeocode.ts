import { useState, useCallback } from 'react';

export function useGeocode() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const geocode = useCallback(async (address: string) => {
    if (!window.google) {
      throw new Error('Google Maps API not loaded');
    }

    setLoading(true);
    setError(null);

    try {
      const geocoder = new window.google.maps.Geocoder();
      return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            const location = results[0].geometry.location;
            resolve({ lat: location.lat(), lng: location.lng() });
          } else {
            reject(new Error('Geocoding failed'));
          }
        });
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Geocoding failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { geocode, loading, error };
}

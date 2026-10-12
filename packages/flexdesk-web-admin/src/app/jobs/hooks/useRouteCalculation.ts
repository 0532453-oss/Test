import { useState, useCallback } from 'react';

export interface Route {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  steps: Array<{ instruction: string; distance: string; duration: string }>;
}

export function useRouteCalculation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const calculateRoute = useCallback(
    async (
      origin: { lat: number; lng: number },
      destination: { lat: number; lng: number }
    ): Promise<Route> => {
      if (!window.google) {
        throw new Error('Google Maps API not loaded');
      }

      setLoading(true);
      setError(null);

      try {
        const directionsService = new window.google.maps.DirectionsService();
        return new Promise<Route>((resolve, reject) => {
          directionsService.route(
            {
              origin: new window.google.maps.LatLng(origin.lat, origin.lng),
              destination: new window.google.maps.LatLng(destination.lat, destination.lng),
              travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (status === 'OK' && result) {
                const route = result.routes[0];
                const leg = route.legs[0];
                resolve({
                  distance: leg.distance!,
                  duration: leg.duration!,
                  steps: leg.steps.map((step) => ({
                    instruction: step.instructions,
                    distance: step.distance?.text || '',
                    duration: step.duration?.text || '',
                  })),
                });
              } else {
                reject(new Error('Route calculation failed'));
              }
            }
          );
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Route calculation failed');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { calculateRoute, loading, error };
}

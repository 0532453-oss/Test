import { useState } from 'react';
import { useRouteCalculation } from '../hooks/useRouteCalculation';
import type { JobLocation } from '../types/Job';

interface RouteOptimizerProps {
  jobs: Array<{ id: string; location: JobLocation }>;
  currentLocation: { lat: number; lng: number };
  onOptimized?: (order: string[]) => void;
}

export function RouteOptimizer({ jobs, currentLocation, onOptimized }: RouteOptimizerProps) {
  const [optimizedOrder, setOptimizedOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { calculateRoute } = useRouteCalculation();

  const optimizeRoute = async () => {
    setLoading(true);
    // Simple nearest-neighbor algorithm
    const unvisited = [...jobs];
    const order: string[] = [];
    let current = currentLocation;

    while (unvisited.length > 0) {
      let nearest = unvisited[0];
      let minDistance = Infinity;

      for (const job of unvisited) {
        const distance = Math.sqrt(
          Math.pow(job.location.lat - current.lat, 2) +
            Math.pow(job.location.lng - current.lng, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearest = job;
        }
      }

      order.push(nearest.id);
      current = { lat: nearest.location.lat, lng: nearest.location.lng };
      unvisited.splice(unvisited.indexOf(nearest), 1);
    }

    setOptimizedOrder(order);
    onOptimized?.(order);
    setLoading(false);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <button
        onClick={optimizeRoute}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
      >
        {loading ? 'Optimizing...' : 'Optimize Route'}
      </button>
      {optimizedOrder.length > 0 && (
        <div className="mt-4">
          <p className="font-semibold mb-2">Optimized Order:</p>
          <ol className="list-decimal list-inside">
            {optimizedOrder.map((id) => (
              <li key={id} className="text-sm">
                Job {id}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

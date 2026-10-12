/**
 * Hook to fetch multiple records using REST API
 *
 * Adapted from Twenty's GraphQL version to use REST with optimistic caching
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { indexedDBClient, type StoreName } from '../api/indexedDB';
import type { ObjectRecord } from '@service-flex/types';

export interface RecordFilter {
  [key: string]: any;
}

export interface RecordOrderBy {
  field: string;
  direction: 'asc' | 'desc';
}

export interface UseFindManyRecordsOptions<T extends ObjectRecord = ObjectRecord> {
  objectNameSingular: string;
  filter?: RecordFilter;
  orderBy?: RecordOrderBy[];
  limit?: number;
  skip?: boolean;
  onCompleted?: (data: T[]) => void;
  onError?: (error: Error) => void;
}

export function useFindManyRecords<T extends ObjectRecord = ObjectRecord>({
  objectNameSingular,
  filter,
  orderBy,
  limit = 50,
  skip = false,
  onCompleted,
  onError,
}: UseFindManyRecordsOptions<T>) {
  const [records, setRecords] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchRecords = useCallback(async () => {
    if (skip) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filter) {
        params.append('filter', JSON.stringify(filter));
      }
      
      if (orderBy && orderBy.length > 0) {
        params.append('orderBy', JSON.stringify(orderBy));
      }
      
      if (limit) {
        params.append('limit', limit.toString());
      }

      const endpoint = `/api/${objectNameSingular.toLowerCase()}s?${params.toString()}`;

      // Try cache first for simple queries
      if (!filter && !orderBy) {
        const storeName = (objectNameSingular.toLowerCase() + 's') as StoreName;
        const cached = await indexedDBClient.getAll<T>(storeName);

        if (cached.length > 0) {
          setRecords(cached.slice(0, limit));
          setLoading(false);
          onCompleted?.(cached.slice(0, limit));

          // Fetch in background to update cache
          apiClient
            .get<{ data: T[]; hasMore: boolean }>(endpoint)
            .then((response) => {
              if (response.data) {
                const data = Array.isArray(response.data) ? response.data : response.data.data || [];
                setRecords(data);
                setHasMore(response.data.hasMore || false);

                // Update cache
                indexedDBClient.putMany(storeName, data as Array<T & { id: string }>);
                onCompleted?.(data);
              }
            })
            .catch(() => {
              // Ignore background fetch errors
            });
          return;
        }
      }

      // Fetch from API
      const response = await apiClient.get<{ data: T[]; hasMore?: boolean } | T[]>(
        endpoint
      );

      const data = Array.isArray(response.data)
        ? response.data
        : (response.data as any)?.data || [];

      setRecords(data);
      setHasMore((response.data as any)?.hasMore || false);

      // Update cache
      if (data.length > 0) {
        const storeName = (objectNameSingular.toLowerCase() + 's') as StoreName;
        await indexedDBClient.putMany(storeName, data as Array<T & { id: string }>);
      }

      onCompleted?.(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch records');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [objectNameSingular, filter, orderBy, limit, skip, onCompleted, onError]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const refetch = useCallback(() => {
    return fetchRecords();
  }, [fetchRecords]);

  const fetchMore = useCallback(async () => {
    if (!hasMore || loading) return;

    try {
      const params = new URLSearchParams();
      
      if (filter) {
        params.append('filter', JSON.stringify(filter));
      }
      
      if (orderBy && orderBy.length > 0) {
        params.append('orderBy', JSON.stringify(orderBy));
      }
      
      params.append('limit', limit.toString());
      params.append('offset', records.length.toString());

      const endpoint = `/api/${objectNameSingular.toLowerCase()}s?${params.toString()}`;
      const response = await apiClient.get<{ data: T[]; hasMore?: boolean } | T[]>(
        endpoint
      );

      const data = Array.isArray(response.data)
        ? response.data
        : (response.data as any)?.data || [];

      setRecords((prev) => [...prev, ...data]);
      setHasMore((response.data as any)?.hasMore || false);

      // Update cache
      if (data.length > 0) {
        const storeName = (objectNameSingular.toLowerCase() + 's') as StoreName;
        await indexedDBClient.putMany(storeName, data as Array<T & { id: string }>);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch more records');
      setError(error);
      onError?.(error);
    }
  }, [objectNameSingular, filter, orderBy, limit, hasMore, loading, records.length, onError]);

  return {
    records,
    loading,
    error,
    refetch,
    fetchMore,
    hasMore,
  };
}

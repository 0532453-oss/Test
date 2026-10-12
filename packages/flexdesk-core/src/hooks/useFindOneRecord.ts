/**
 * Hook to fetch a single record using REST API
 *
 * Adapted from Twenty's GraphQL version to use REST with optimistic caching
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { indexedDBClient, type StoreName } from '../api/indexedDB';
import type { ObjectRecord } from '@service-flex/types';

export interface UseFindOneRecordOptions<T extends ObjectRecord = ObjectRecord> {
  objectNameSingular: string;
  objectRecordId: string;
  skip?: boolean;
  onCompleted?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useFindOneRecord<T extends ObjectRecord = ObjectRecord>({
  objectNameSingular,
  objectRecordId,
  skip = false,
  onCompleted,
  onError,
}: UseFindOneRecordOptions<T>) {
  const [record, setRecord] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecord = useCallback(async () => {
    if (skip || !objectRecordId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Try cache first
      const storeName = (objectNameSingular.toLowerCase() + 's') as StoreName;
      const cached = await indexedDBClient.get<T>(storeName, objectRecordId);

      if (cached) {
        setRecord(cached);
        setLoading(false);
        onCompleted?.(cached);

        // Fetch in background to update cache
        apiClient
          .get<T>(`/${objectNameSingular.toLowerCase()}s/${objectRecordId}`)
          .then((response) => {
            if (response.data) {
              setRecord(response.data);
              indexedDBClient.put(storeName, response.data as T & { id: string });
              onCompleted?.(response.data);
            }
          })
          .catch(() => {
            // Ignore background fetch errors
          });
        return;
      }

      // Fetch from API
      const response = await apiClient.get<T>(
        `/${objectNameSingular.toLowerCase()}s/${objectRecordId}`
      );

      if (response.data) {
        setRecord(response.data);

        // Update cache
        await indexedDBClient.put(storeName, response.data as T & { id: string });

        onCompleted?.(response.data);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch record');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [objectNameSingular, objectRecordId, skip, onCompleted, onError]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  const refetch = useCallback(() => {
    return fetchRecord();
  }, [fetchRecord]);

  return {
    record,
    loading,
    error,
    refetch,
  };
}

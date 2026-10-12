/**
 * Hook to update a record using REST API with optimistic updates
 *
 * Adapted from Twenty's GraphQL version to use REST
 */

import { useState, useCallback } from 'react';
import { apiClient, type OptimisticUpdate } from '../api/client';
import { indexedDBClient, type StoreName } from '../api/indexedDB';
import type { ObjectRecord } from '@service-flex/types';

export interface UseUpdateOneRecordOptions<T extends ObjectRecord = ObjectRecord> {
  objectNameSingular: string;
  objectRecordId: string;
  onCompleted?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useUpdateOneRecord<T extends ObjectRecord = ObjectRecord>({
  objectNameSingular,
  objectRecordId,
  onCompleted,
  onError,
}: UseUpdateOneRecordOptions<T>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateRecord = useCallback(
    async (data: Partial<T>) => {
      if (!objectRecordId) {
        throw new Error('Record ID is required');
      }

      setLoading(true);
      setError(null);

      try {
        // Get current record for rollback
        const storeName = (objectNameSingular.toLowerCase() + 's') as StoreName;
        const currentRecord = await indexedDBClient.get<T>(storeName, objectRecordId);

        // Optimistic update
        const optimisticUpdate: OptimisticUpdate<T> = {
          update: (current: T | undefined) => {
            if (!current) {
              throw new Error('Record not found');
            }
            return {
              ...current,
              ...data,
              updatedAt: new Date().toISOString(),
            } as T;
          },
          entityType: objectNameSingular,
          entityId: objectRecordId,
          rollback: async (previous: T | undefined) => {
            if (previous) {
              await indexedDBClient.put(storeName, previous as T & { id: string });
            }
          },
        };

        // Make API call
        const response = await apiClient.patch<T>(
          `/${objectNameSingular.toLowerCase()}s/${objectRecordId}`,
          data,
          { optimistic: optimisticUpdate as OptimisticUpdate<unknown> }
        );

        if (response.data) {
          // Update cache with server response
          await indexedDBClient.put(storeName, response.data as T & { id: string });
          onCompleted?.(response.data);
          return response.data;
        }

        throw new Error('No data returned from update operation');
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update record');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [objectNameSingular, objectRecordId, onCompleted, onError]
  );

  return {
    updateRecord,
    loading,
    error,
  };
}

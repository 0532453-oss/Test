/**
 * Hook to create a record using REST API with optimistic updates
 *
 * Adapted from Twenty's GraphQL version to use REST
 */

import { useState, useCallback } from 'react';
import { apiClient, type OptimisticUpdate } from '../api/client';
import { indexedDBClient, type StoreName } from '../api/indexedDB';
import type { ObjectRecord } from '@service-flex/types';

export interface UseCreateOneRecordOptions<T extends ObjectRecord = ObjectRecord> {
  objectNameSingular: string;
  onCompleted?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useCreateOneRecord<T extends ObjectRecord = ObjectRecord>({
  objectNameSingular,
  onCompleted,
  onError,
}: UseCreateOneRecordOptions<T>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createRecord = useCallback(
    async (data: Partial<T>) => {
      setLoading(true);
      setError(null);

      try {
        // Generate temporary ID for optimistic update
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const optimisticRecord = {
          ...data,
          id: tempId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as T;

        // Optimistic update
        const optimisticUpdate: OptimisticUpdate<T> = {
          update: () => optimisticRecord,
          entityType: objectNameSingular,
          entityId: tempId,
          rollback: async (previous: T | undefined) => {
            if (previous) {
              const storeName = (objectNameSingular.toLowerCase() + 's') as StoreName;
              await indexedDBClient.put(storeName, previous as T & { id: string });
            }
          },
        };

        // Make API call
        const response = await apiClient.post<T>(
          `/${objectNameSingular.toLowerCase()}s`,
          data,
          { optimistic: optimisticUpdate as OptimisticUpdate<unknown> }
        );

        if (response.data) {
          // Update cache with server response (which has real ID)
          const storeName = (objectNameSingular.toLowerCase() + 's') as StoreName;
          await indexedDBClient.put(storeName, response.data as T & { id: string });

          // Remove temporary record if it exists
          try {
            await indexedDBClient.remove(storeName, tempId);
          } catch {
            // Ignore if temp record doesn't exist
          }

          onCompleted?.(response.data);
          return response.data;
        }

        throw new Error('No data returned from create operation');
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create record');
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [objectNameSingular, onCompleted, onError]
  );

  return {
    createRecord,
    loading,
    error,
  };
}

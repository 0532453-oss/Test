/**
 * API Client with Optimistic UI Pattern
 * 
 * Provides REST API client with:
 * - Optimistic updates (immediate UI feedback)
 * - Offline queue management via SyncManager
 * - IndexedDB caching
 * - Automatic retry logic
 */

import { indexedDBClient } from '@/modules/api/storage/IndexedDBClient';
import { syncManager } from '@/modules/api/sync/SyncManager';
import { SyncOperationType } from '@/modules/api/sync/types/SyncOperation';

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  optimistic?: OptimisticUpdate;
  skipCache?: boolean;
}

export interface OptimisticUpdate<T = any> {
  /**
   * Update function to apply optimistic state change
   * This runs immediately before the API call
   */
  update: (current: T | undefined) => T;
  
  /**
   * Rollback function if the API call fails
   * Receives the previous value to restore
   */
  rollback?: (previous: T | undefined) => void;
  
  /**
   * Entity type for cache invalidation
   */
  entityType?: string;
  
  /**
   * Entity ID for cache invalidation
   */
  entityId?: string;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  /**
   * Set authorization token
   */
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Set workspace ID header
   */
  setWorkspaceId(workspaceId: string): void {
    this.defaultHeaders['X-Workspace-Id'] = workspaceId;
  }

  /**
   * Make a request to the API
   */
  async request<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      headers = {},
      optimistic,
      skipCache = false,
    } = options;

    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${this.baseURL}${endpoint}`;

    // Apply optimistic update if provided
    let previousValue: any;
    if (optimistic) {
      // Get current value from cache if available
      if (optimistic.entityType && optimistic.entityId) {
        const storeName = optimistic.entityType.toLowerCase() + 's';
        previousValue = await indexedDBClient.get(storeName, optimistic.entityId);
        
        // Apply optimistic update
        const optimisticValue = optimistic.update(previousValue);
        
        // Update cache immediately
        if (optimisticValue) {
          await indexedDBClient.put(storeName, optimisticValue);
        }
      }
    }

    // Check if offline
    if (!syncManager.isOnline() && method !== 'GET') {
      // Queue operation for later sync
      await this.queueOfflineOperation(endpoint, method, body, optimistic);
      
      // Return optimistic response
      if (optimistic && previousValue) {
        return {
          data: optimistic.update(previousValue),
          status: 202, // Accepted
          statusText: 'Queued for sync',
        };
      }
      
      throw new Error('Device is offline. Operation queued for sync.');
    }

    try {
      // Try to get from cache first for GET requests
      if (method === 'GET' && !skipCache) {
        const cached = await this.getFromCache<T>(endpoint);
        if (cached) {
          // Still fetch in background to update cache
          this.fetchInBackground(url, method, body, headers).catch(() => {
            // Ignore background fetch errors
          });
          return cached;
        }
      }

      // Make the actual API call
      const response = await fetch(url, {
        method,
        headers: {
          ...this.defaultHeaders,
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        // Rollback optimistic update on error
        if (optimistic?.rollback && previousValue !== undefined) {
          optimistic.rollback(previousValue);
          
          // Restore cache
          if (optimistic.entityType && optimistic.entityId) {
            const storeName = optimistic.entityType.toLowerCase() + 's';
            await indexedDBClient.put(storeName, previousValue);
          }
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Request failed with status ${response.status}`
        );
      }

      const data = await response.json().catch(() => ({}));

      // Update cache for successful responses
      if (method === 'GET' && data) {
        await this.updateCache(endpoint, data);
      } else if (method !== 'GET' && data && optimistic?.entityType) {
        // Update cache with server response
        const storeName = optimistic.entityType.toLowerCase() + 's';
        if (data.id) {
          await indexedDBClient.put(storeName, data);
        }
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
      };
    } catch (error) {
      // Rollback optimistic update on error
      if (optimistic?.rollback && previousValue !== undefined) {
        optimistic.rollback(previousValue);
        
        if (optimistic.entityType && optimistic.entityId) {
          const storeName = optimistic.entityType.toLowerCase() + 's';
          await indexedDBClient.put(storeName, previousValue);
        }
      }

      // If offline and not already queued, queue it
      if (!syncManager.isOnline() && method !== 'GET') {
        await this.queueOfflineOperation(endpoint, method, body, optimistic);
      }

      throw error;
    }
  }

  /**
   * Queue an operation for offline sync
   */
  private async queueOfflineOperation(
    endpoint: string,
    method: string,
    body: any,
    optimistic?: OptimisticUpdate
  ): Promise<void> {
    const entityType = this.extractEntityType(endpoint);
    const entityId = body?.id || this.extractEntityId(endpoint);

    await syncManager.queueOperation({
      type: this.getOperationType(method),
      entityType: entityType || 'Unknown',
      entityId: entityId || 'unknown',
      data: body,
      endpoint,
      method: method as 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    });
  }

  /**
   * Get operation type from HTTP method
   */
  private getOperationType(method: string): SyncOperationType {
    switch (method) {
      case 'POST':
        return SyncOperationType.CREATE;
      case 'PUT':
      case 'PATCH':
        return SyncOperationType.UPDATE;
      case 'DELETE':
        return SyncOperationType.DELETE;
      default:
        return SyncOperationType.UPDATE;
    }
  }

  /**
   * Extract entity type from endpoint
   */
  private extractEntityType(endpoint: string): string | null {
    const match = endpoint.match(/\/(jobs|technicians|customers|invoices)/);
    return match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : null;
  }

  /**
   * Extract entity ID from endpoint
   */
  private extractEntityId(endpoint: string): string | null {
    const match = endpoint.match(/\/([a-f0-9-]{36})/);
    return match ? match[1] : null;
  }

  /**
   * Get from cache
   */
  private async getFromCache<T>(endpoint: string): Promise<ApiResponse<T> | null> {
    // Extract entity info from endpoint
    const entityType = this.extractEntityType(endpoint);
    const entityId = this.extractEntityId(endpoint);

    if (!entityType || !entityId) {
      return null;
    }

    const storeName = entityType.toLowerCase() + 's';
    const cached = await indexedDBClient.get<T>(storeName, entityId);

    if (cached) {
      return {
        data: cached,
        status: 200,
        statusText: 'OK (cached)',
      };
    }

    return null;
  }

  /**
   * Update cache
   */
  private async updateCache(endpoint: string, data: any): Promise<void> {
    const entityType = this.extractEntityType(endpoint);
    
    if (!entityType || !data?.id) {
      return;
    }

    const storeName = entityType.toLowerCase() + 's';
    await indexedDBClient.put(storeName, data);
  }

  /**
   * Fetch in background (for cache updates)
   */
  private async fetchInBackground(
    url: string,
    method: string,
    body: any,
    headers: Record<string, string>
  ): Promise<void> {
    try {
      await fetch(url, {
        method,
        headers: {
          ...this.defaultHeaders,
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      // Ignore background fetch errors
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async patch<T = any>(
    endpoint: string,
    body?: any,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete<T = any>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Singleton instance
export const apiClient = new ApiClient();


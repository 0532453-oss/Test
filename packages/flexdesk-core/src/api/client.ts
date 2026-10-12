/**
 * Unified API Client for Service Flex
 *
 * Features:
 * - Optimistic updates (immediate UI feedback)
 * - Offline queue management
 * - IndexedDB caching
 * - Auto-retry logic
 * - Bearer token authentication
 */

import { tokenStorage } from '../auth/storage';
import { getApiUrl } from '../config/env';
import { indexedDBClient, type StoreName } from './indexedDB';
import { syncManager, SyncOperationType, SyncOperationStatus } from './syncManager';
import { apiDebugStore } from './apiDebugStore';

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  optimistic?: OptimisticUpdate;
  skipCache?: boolean;
  skipAuth?: boolean;
  /** Maximum number of retry attempts for transient failures (default: 3) */
  maxRetries?: number;
  /** Idempotency key -- required for POST retries to prevent duplicate creation */
  idempotencyKey?: string;
}

export interface OptimisticUpdate<T = unknown> {
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

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  fromCache?: boolean;
}

export interface ApiClientConfig {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
}

/** HTTP status codes that are safe to retry (transient server/rate-limit errors) */
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

/** Maximum backoff delay in ms */
const MAX_BACKOFF_MS = 30_000;

/** Base delay for exponential backoff in ms */
const BASE_DELAY_MS = 1_000;

/** Jitter factor (+/- 20%) */
const JITTER_FACTOR = 0.2;

export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiClientConfig = {}) {
    this.baseURL = config.baseUrl || getApiUrl();
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.defaultHeaders,
    };

    // Set up sync callback
    syncManager.setSyncCallback(this.processSyncOperations.bind(this));
  }

  /**
   * Get headers with auth token
   */
  private getHeaders(additionalHeaders: Record<string, string> = {}, skipAuth = false): Record<string, string> {
    const headers = { ...this.defaultHeaders, ...additionalHeaders };

    if (!skipAuth) {
      const token = tokenStorage.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const workspaceId = tokenStorage.getWorkspaceId();
      if (workspaceId) {
        headers['X-Workspace-Id'] = workspaceId;
      }
    }

    // CSRF double-submit: read csrf_token cookie and send as header
    const csrfToken = this.getCookie('csrf_token');
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    return headers;
  }

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  /**
   * Compute the retry delay with exponential backoff and jitter.
   * Formula: min(BASE_DELAY * 2^attempt, MAX_BACKOFF) * (1 +/- JITTER_FACTOR)
   */
  private computeRetryDelay(attempt: number): number {
    const exponentialDelay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_BACKOFF_MS);
    const jitter = exponentialDelay * JITTER_FACTOR * (2 * Math.random() - 1);
    return exponentialDelay + jitter;
  }

  /**
   * Whether a request is eligible for retry based on method and options.
   * POST requests without an idempotency key are NOT retried to prevent duplicate creation.
   */
  private isRetryAllowed(method: string, idempotencyKey?: string): boolean {
    if (method === 'POST' && !idempotencyKey) {
      return false;
    }
    return true;
  }

  /**
   * Whether an error/status is retryable (transient failure).
   */
  private isRetryableError(status: number): boolean {
    return RETRYABLE_STATUSES.has(status);
  }

  /**
   * Sleep for a given number of milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Make a request to the API
   */
  async request<T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      headers = {},
      optimistic,
      skipCache = false,
      skipAuth = false,
      maxRetries = 3,
      idempotencyKey,
    } = options;

    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseURL}${endpoint}`;

    // Apply optimistic update if provided
    let previousValue: T | undefined;
    if (optimistic?.entityType && optimistic?.entityId) {
      const storeName = (optimistic.entityType.toLowerCase() + 's') as StoreName;
      previousValue = await indexedDBClient.get<T>(storeName, optimistic.entityId) ?? undefined;

      // Apply optimistic update to cache immediately
      const optimisticValue = optimistic.update(previousValue);
      if (optimisticValue && typeof optimisticValue === 'object' && 'id' in optimisticValue) {
        await indexedDBClient.put(storeName, optimisticValue as { id: string });
      }
    }

    // Check if offline for write operations
    if (!syncManager.isOnline() && method !== 'GET') {
      await this.queueOfflineOperation(endpoint, method, body, optimistic);

      if (optimistic && previousValue !== undefined) {
        return {
          data: optimistic.update(previousValue) as T,
          status: 202,
          statusText: 'Queued for sync',
        };
      }

      throw new Error('Device is offline. Operation queued for sync.');
    }

    const requestStartTime = Date.now();
    const canRetry = this.isRetryAllowed(method, idempotencyKey);
    let lastError: Error | undefined;

    // Try cache first for GET requests (only on initial attempt)
    if (method === 'GET' && !skipCache) {
      const cached = await this.getFromCache<T>(endpoint);
      if (cached) {
        apiDebugStore.add({
          timestamp: new Date().toISOString(),
          method,
          url,
          status: 200,
          durationMs: Date.now() - requestStartTime,
          fromCache: true,
        });
        // Refresh in background
        this.fetchInBackground(url, this.getHeaders(headers, skipAuth));
        return cached;
      }
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      // Wait before retrying (not on first attempt)
      if (attempt > 0) {
        const delay = this.computeRetryDelay(attempt - 1);
        apiDebugStore.add({
          timestamp: new Date().toISOString(),
          method,
          url,
          status: 0,
          durationMs: 0,
          fromCache: false,
          error: `Retry attempt ${attempt}/${maxRetries} after ${Math.round(delay)}ms`,
        });
        await this.sleep(delay);
      }

      try {
        const fetchHeaders = this.getHeaders(headers, skipAuth);

        const response = await fetch(url, {
          method,
          headers: fetchHeaders,
          body: body ? JSON.stringify(body) : undefined,
          credentials: 'include',
        });

        apiDebugStore.add({
          timestamp: new Date().toISOString(),
          method,
          url,
          status: response.status,
          durationMs: Date.now() - requestStartTime,
          fromCache: false,
          error: response.ok ? undefined : `HTTP ${response.status}`,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = (errorData as { message?: string }).message || `Request failed with status ${response.status}`;
          lastError = new Error(errorMessage);

          // Check if this status is retryable and we have retries remaining
          if (canRetry && this.isRetryableError(response.status) && attempt < maxRetries) {
            continue;
          }

          // Non-retryable error or retries exhausted -- rollback and throw
          await this.rollbackOptimistic(optimistic, previousValue);
          throw lastError;
        }

        const data = (await response.json().catch(() => ({}))) as T;

        // Update cache
        await this.updateCacheFromResponse(endpoint, method, data, optimistic);

        return {
          data,
          status: response.status,
          statusText: response.statusText,
        };
      } catch (error) {
        const isNetworkError = error instanceof TypeError || (error instanceof Error && error.message.includes('fetch'));

        if (isNetworkError) {
          apiDebugStore.add({
            timestamp: new Date().toISOString(),
            method,
            url,
            status: 0,
            durationMs: Date.now() - requestStartTime,
            fromCache: false,
            error: error instanceof Error ? error.message : 'Network error',
          });
          lastError = error instanceof Error ? error : new Error('Network error');

          // Network errors are retryable
          if (canRetry && attempt < maxRetries) {
            continue;
          }
        } else {
          // Non-network errors (including our own thrown errors from non-ok responses) are not retried
          lastError = error instanceof Error ? error : new Error(String(error));
        }

        // Rollback optimistic update on final error
        await this.rollbackOptimistic(optimistic, previousValue);

        // Queue for offline sync if network error
        if (!syncManager.isOnline() && method !== 'GET') {
          await this.queueOfflineOperation(endpoint, method, body, optimistic);
        }

        throw lastError;
      }
    }

    // Should not reach here, but safety net
    await this.rollbackOptimistic(optimistic, previousValue);
    throw lastError || new Error('Request failed after all retries');
  }

  /**
   * Rollback an optimistic update
   */
  private async rollbackOptimistic<T>(
    optimistic: OptimisticUpdate<T> | undefined,
    previousValue: T | undefined
  ): Promise<void> {
    if (!optimistic?.entityType || !optimistic?.entityId || previousValue === undefined) {
      return;
    }

    if (optimistic.rollback) {
      optimistic.rollback(previousValue);
    }

    const storeName = (optimistic.entityType.toLowerCase() + 's') as StoreName;
    if (previousValue && typeof previousValue === 'object' && 'id' in previousValue) {
      await indexedDBClient.put(storeName, previousValue as { id: string });
    }
  }

  /**
   * Queue an offline operation
   */
  private async queueOfflineOperation(
    endpoint: string,
    method: string,
    body: unknown,
    optimistic?: OptimisticUpdate
  ): Promise<void> {
    const entityType = this.extractEntityType(endpoint);
    const entityId = (body as { id?: string })?.id || this.extractEntityId(endpoint);

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
   * Process sync operations (callback for syncManager)
   */
  private async processSyncOperations(operations: Array<{
    id: string;
    endpoint: string;
    method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    data: unknown;
  }>): Promise<void> {
    for (const op of operations) {
      try {
        const response = await fetch(`${this.baseURL}${op.endpoint}`, {
          method: op.method,
          headers: this.getHeaders(),
          body: op.data ? JSON.stringify(op.data) : undefined,
          credentials: 'include',
        });

        if (response.ok) {
          await syncManager.updateOperationStatus(op.id, SyncOperationStatus.COMPLETED);
          await syncManager.removeOperation(op.id);
        } else {
          const error = await response.text();
          await syncManager.updateOperationStatus(op.id, SyncOperationStatus.FAILED, error);
        }
      } catch (error) {
        await syncManager.updateOperationStatus(
          op.id,
          SyncOperationStatus.FAILED,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
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
    const match = endpoint.match(/\/(jobs|technicians|customers|invoices|estimates|requests)/);
    return match ? match[1].charAt(0).toUpperCase() + match[1].slice(1, -1) : null;
  }

  /**
   * Extract entity ID from endpoint
   */
  private extractEntityId(endpoint: string): string | null {
    const match = endpoint.match(/\/([a-f0-9-]{36})/i);
    return match ? match[1] : null;
  }

  /**
   * Get from cache
   */
  private async getFromCache<T>(endpoint: string): Promise<ApiResponse<T> | null> {
    const entityType = this.extractEntityType(endpoint);
    const entityId = this.extractEntityId(endpoint);

    if (!entityType || !entityId) {
      return null;
    }

    const storeName = (entityType.toLowerCase() + 's') as StoreName;
    const cached = await indexedDBClient.get<T>(storeName, entityId);

    if (cached) {
      return {
        data: cached,
        status: 200,
        statusText: 'OK (cached)',
        fromCache: true,
      };
    }

    return null;
  }

  /**
   * Update cache from response
   */
  private async updateCacheFromResponse<T>(
    endpoint: string,
    method: string,
    data: T,
    optimistic?: OptimisticUpdate
  ): Promise<void> {
    const entityType = optimistic?.entityType || this.extractEntityType(endpoint);

    if (!entityType || !data || typeof data !== 'object' || !('id' in data)) {
      return;
    }

    const storeName = (entityType.toLowerCase() + 's') as StoreName;

    if (method === 'DELETE') {
      await indexedDBClient.remove(storeName, (data as { id: string }).id);
    } else {
      await indexedDBClient.put(storeName, data as { id: string });
    }
  }

  /**
   * Fetch in background for cache update
   */
  private async fetchInBackground(url: string, headers: Record<string, string>): Promise<void> {
    try {
      const response = await fetch(url, { method: 'GET', headers, credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        const entityType = this.extractEntityType(url);
        if (entityType && data?.id) {
          const storeName = (entityType.toLowerCase() + 's') as StoreName;
          await indexedDBClient.put(storeName, data);
        }
      }
    } catch {
      // Ignore background fetch errors
    }
  }

  // Convenience methods
  async get<T = unknown>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T = unknown>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async patch<T = unknown>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete<T = unknown>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export factory function for custom configurations
export function createApiClient(config?: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiClient = exports.ApiClient = void 0;
const IndexedDBClient_1 = require("../storage/IndexedDBClient");
const SyncManager_1 = require("../sync/SyncManager");
const SyncOperation_1 = require("../sync/types/SyncOperation");
class ApiClient {
    constructor(baseURL = '/api') {
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
        this.baseURL = baseURL;
    }
    setAuthToken(token) {
        this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    setWorkspaceId(workspaceId) {
        this.defaultHeaders['X-Workspace-Id'] = workspaceId;
    }
    async request(endpoint, options = {}) {
        const { method = 'GET', body, headers = {}, optimistic, skipCache = false, } = options;
        const url = endpoint.startsWith('http')
            ? endpoint
            : `${this.baseURL}${endpoint}`;
        let previousValue;
        if (optimistic) {
            if (optimistic.entityType && optimistic.entityId) {
                const storeName = optimistic.entityType.toLowerCase() + 's';
                previousValue = await IndexedDBClient_1.indexedDBClient.get(storeName, optimistic.entityId);
                const optimisticValue = optimistic.update(previousValue);
                if (optimisticValue) {
                    await IndexedDBClient_1.indexedDBClient.put(storeName, optimisticValue);
                }
            }
        }
        if (!SyncManager_1.syncManager.isOnline() && method !== 'GET') {
            await this.queueOfflineOperation(endpoint, method, body, optimistic);
            if (optimistic && previousValue) {
                return {
                    data: optimistic.update(previousValue),
                    status: 202,
                    statusText: 'Queued for sync',
                };
            }
            throw new Error('Device is offline. Operation queued for sync.');
        }
        try {
            if (method === 'GET' && !skipCache) {
                const cached = await this.getFromCache(endpoint);
                if (cached) {
                    this.fetchInBackground(url, method, body, headers).catch(() => {
                    });
                    return cached;
                }
            }
            const response = await fetch(url, {
                method,
                headers: {
                    ...this.defaultHeaders,
                    ...headers,
                },
                body: body ? JSON.stringify(body) : undefined,
            });
            if (!response.ok) {
                if (optimistic?.rollback && previousValue !== undefined) {
                    optimistic.rollback(previousValue);
                    if (optimistic.entityType && optimistic.entityId) {
                        const storeName = optimistic.entityType.toLowerCase() + 's';
                        await IndexedDBClient_1.indexedDBClient.put(storeName, previousValue);
                    }
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Request failed with status ${response.status}`);
            }
            const data = await response.json().catch(() => ({}));
            if (method === 'GET' && data) {
                await this.updateCache(endpoint, data);
            }
            else if (method !== 'GET' && data && optimistic?.entityType) {
                const storeName = optimistic.entityType.toLowerCase() + 's';
                if (data.id) {
                    await IndexedDBClient_1.indexedDBClient.put(storeName, data);
                }
            }
            return {
                data,
                status: response.status,
                statusText: response.statusText,
            };
        }
        catch (error) {
            if (optimistic?.rollback && previousValue !== undefined) {
                optimistic.rollback(previousValue);
                if (optimistic.entityType && optimistic.entityId) {
                    const storeName = optimistic.entityType.toLowerCase() + 's';
                    await IndexedDBClient_1.indexedDBClient.put(storeName, previousValue);
                }
            }
            if (!SyncManager_1.syncManager.isOnline() && method !== 'GET') {
                await this.queueOfflineOperation(endpoint, method, body, optimistic);
            }
            throw error;
        }
    }
    async queueOfflineOperation(endpoint, method, body, optimistic) {
        const entityType = this.extractEntityType(endpoint);
        const entityId = body?.id || this.extractEntityId(endpoint);
        await SyncManager_1.syncManager.queueOperation({
            type: this.getOperationType(method),
            entityType: entityType || 'Unknown',
            entityId: entityId || 'unknown',
            data: body,
            endpoint,
            method: method,
        });
    }
    getOperationType(method) {
        switch (method) {
            case 'POST':
                return SyncOperation_1.SyncOperationType.CREATE;
            case 'PUT':
            case 'PATCH':
                return SyncOperation_1.SyncOperationType.UPDATE;
            case 'DELETE':
                return SyncOperation_1.SyncOperationType.DELETE;
            default:
                return SyncOperation_1.SyncOperationType.UPDATE;
        }
    }
    extractEntityType(endpoint) {
        const match = endpoint.match(/\/(jobs|technicians|customers|invoices)/);
        return match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : null;
    }
    extractEntityId(endpoint) {
        const match = endpoint.match(/\/([a-f0-9-]{36})/);
        return match ? match[1] : null;
    }
    async getFromCache(endpoint) {
        const entityType = this.extractEntityType(endpoint);
        const entityId = this.extractEntityId(endpoint);
        if (!entityType || !entityId) {
            return null;
        }
        const storeName = entityType.toLowerCase() + 's';
        const cached = await IndexedDBClient_1.indexedDBClient.get(storeName, entityId);
        if (cached) {
            return {
                data: cached,
                status: 200,
                statusText: 'OK (cached)',
            };
        }
        return null;
    }
    async updateCache(endpoint, data) {
        const entityType = this.extractEntityType(endpoint);
        if (!entityType || !data?.id) {
            return;
        }
        const storeName = entityType.toLowerCase() + 's';
        await IndexedDBClient_1.indexedDBClient.put(storeName, data);
    }
    async fetchInBackground(url, method, body, headers) {
        try {
            await fetch(url, {
                method,
                headers: {
                    ...this.defaultHeaders,
                    ...headers,
                },
                body: body ? JSON.stringify(body) : undefined,
            });
        }
        catch {
        }
    }
    async get(endpoint, options) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }
    async post(endpoint, body, options) {
        return this.request(endpoint, { ...options, method: 'POST', body });
    }
    async put(endpoint, body, options) {
        return this.request(endpoint, { ...options, method: 'PUT', body });
    }
    async patch(endpoint, body, options) {
        return this.request(endpoint, { ...options, method: 'PATCH', body });
    }
    async delete(endpoint, options) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}
exports.ApiClient = ApiClient;
exports.apiClient = new ApiClient();

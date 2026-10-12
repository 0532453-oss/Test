"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncManager = exports.SyncManager = void 0;
const IndexedDBClient_1 = require("../storage/IndexedDBClient");
const SyncOperation_1 = require("./types/SyncOperation");
class SyncManager {
    constructor() {
        this.syncInProgress = false;
        this.onlineListeners = [];
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.processQueue());
            window.addEventListener('offline', () => {
            });
        }
    }
    isOnline() {
        if (typeof navigator === 'undefined') {
            return true;
        }
        return navigator.onLine;
    }
    async queueOperation(operation) {
        const syncOperation = {
            ...operation,
            id: `${operation.entityType}_${operation.entityId}_${Date.now()}`,
            status: SyncOperation_1.SyncOperationStatus.PENDING,
            retryCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        await IndexedDBClient_1.indexedDBClient.init();
        await IndexedDBClient_1.indexedDBClient.put('syncQueue', syncOperation);
        if (this.isOnline()) {
            this.processQueue();
        }
    }
    async getPendingOperations() {
        await IndexedDBClient_1.indexedDBClient.init();
        const allOperations = await IndexedDBClient_1.indexedDBClient.getAll('syncQueue');
        return allOperations.filter((op) => op.status === SyncOperation_1.SyncOperationStatus.PENDING);
    }
    async getSyncStatus() {
        await IndexedDBClient_1.indexedDBClient.init();
        const allOperations = await IndexedDBClient_1.indexedDBClient.getAll('syncQueue');
        return {
            isOnline: this.isOnline(),
            pendingOperations: allOperations.filter((op) => op.status === SyncOperation_1.SyncOperationStatus.PENDING).length,
            syncingOperations: allOperations.filter((op) => op.status === SyncOperation_1.SyncOperationStatus.SYNCING).length,
            failedOperations: allOperations.filter((op) => op.status === SyncOperation_1.SyncOperationStatus.FAILED).length,
        };
    }
    async processQueue() {
        if (!this.isOnline() || this.syncInProgress) {
            return;
        }
        this.syncInProgress = true;
        try {
            const pendingOps = await this.getPendingOperations();
            for (const operation of pendingOps) {
                await this.syncOperation(operation);
            }
        }
        finally {
            this.syncInProgress = false;
        }
    }
    async syncOperation(operation) {
        operation.status = SyncOperation_1.SyncOperationStatus.SYNCING;
        operation.updatedAt = Date.now();
        await IndexedDBClient_1.indexedDBClient.put('syncQueue', operation);
        try {
            const baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';
            const url = operation.endpoint.startsWith('http')
                ? operation.endpoint
                : `${baseURL}${operation.endpoint}`;
            const headers = {
                'Content-Type': 'application/json',
            };
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('auth_token');
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
                const workspaceId = localStorage.getItem('workspace_id');
                if (workspaceId) {
                    headers['X-Workspace-Id'] = workspaceId;
                }
            }
            let response;
            switch (operation.method) {
                case 'POST':
                case 'PUT':
                    response = await fetch(url, {
                        method: operation.method,
                        headers,
                        body: JSON.stringify(operation.data),
                    });
                    break;
                case 'PATCH':
                    response = await fetch(url, {
                        method: 'PATCH',
                        headers,
                        body: JSON.stringify(operation.data),
                    });
                    break;
                case 'DELETE':
                    response = await fetch(url, {
                        method: 'DELETE',
                        headers,
                    });
                    break;
                default:
                    throw new Error(`Unsupported method: ${operation.method}`);
            }
            if (!response.ok) {
                throw new Error(`Sync failed: ${response.statusText}`);
            }
            const data = await response.json().catch(() => ({}));
            await IndexedDBClient_1.indexedDBClient.delete('syncQueue', operation.id);
            if (operation.type !== SyncOperation_1.SyncOperationType.DELETE && data) {
                await this.updateCachedRecord(operation.entityType, data);
            }
            else if (operation.type === SyncOperation_1.SyncOperationType.DELETE) {
                await this.removeCachedRecord(operation.entityType, operation.entityId);
            }
        }
        catch (error) {
            operation.status = SyncOperation_1.SyncOperationStatus.FAILED;
            operation.retryCount += 1;
            operation.error = error instanceof Error ? error.message : 'Unknown error';
            operation.updatedAt = Date.now();
            if (operation.retryCount >= 3) {
                await IndexedDBClient_1.indexedDBClient.delete('syncQueue', operation.id);
            }
            else {
                await IndexedDBClient_1.indexedDBClient.put('syncQueue', operation);
            }
            throw error;
        }
    }
    async updateCachedRecord(entityType, data) {
        const storeName = entityType.toLowerCase() + 's';
        if (['jobs', 'technicians', 'customers', 'invoices'].includes(storeName)) {
            await IndexedDBClient_1.indexedDBClient.put(storeName, data);
        }
    }
    async removeCachedRecord(entityType, entityId) {
        const storeName = entityType.toLowerCase() + 's';
        if (['jobs', 'technicians', 'customers', 'invoices'].includes(storeName)) {
            await IndexedDBClient_1.indexedDBClient.delete(storeName, entityId);
        }
    }
    onOnline(callback) {
        this.onlineListeners.push(callback);
    }
    async clearFailedOperations() {
        await IndexedDBClient_1.indexedDBClient.init();
        const allOperations = await IndexedDBClient_1.indexedDBClient.getAll('syncQueue');
        const failedOps = allOperations.filter((op) => op.status === SyncOperation_1.SyncOperationStatus.FAILED);
        for (const op of failedOps) {
            await IndexedDBClient_1.indexedDBClient.delete('syncQueue', op.id);
        }
    }
}
exports.SyncManager = SyncManager;
exports.syncManager = new SyncManager();

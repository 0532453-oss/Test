"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexedDBClient = exports.IndexedDBClient = exports.STORES = void 0;
const DB_NAME = 'fsm_db';
const DB_VERSION = 1;
exports.STORES = [
    {
        name: 'jobs',
        keyPath: 'id',
        indexes: [
            { name: 'workspaceId', keyPath: 'workspaceId' },
            { name: 'technicianId', keyPath: 'technicianId' },
            { name: 'status', keyPath: 'status' },
            { name: 'scheduledAt', keyPath: 'scheduledAt' },
        ],
    },
    {
        name: 'technicians',
        keyPath: 'id',
        indexes: [{ name: 'workspaceId', keyPath: 'workspaceId' }],
    },
    {
        name: 'customers',
        keyPath: 'id',
        indexes: [{ name: 'workspaceId', keyPath: 'workspaceId' }],
    },
    {
        name: 'invoices',
        keyPath: 'id',
        indexes: [{ name: 'workspaceId', keyPath: 'workspaceId' }],
    },
    {
        name: 'syncQueue',
        keyPath: 'id',
        indexes: [
            { name: 'status', keyPath: 'status' },
            { name: 'createdAt', keyPath: 'createdAt' },
        ],
    },
    {
        name: 'syncMetadata',
        keyPath: 'key',
    },
    {
        name: 'job_attachments',
        keyPath: 'id',
        indexes: [
            { name: 'jobId', keyPath: 'jobId' },
            { name: 'status', keyPath: 'status' },
        ],
    },
];
class IndexedDBClient {
    constructor() {
        this.db = null;
        this.initPromise = null;
    }
    async init() {
        if (this.db) {
            return this.db;
        }
        if (this.initPromise) {
            return this.initPromise;
        }
        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = () => {
                this.initPromise = null;
                reject(new Error('Failed to open IndexedDB'));
            };
            request.onsuccess = () => {
                this.db = request.result;
                this.initPromise = null;
                resolve(this.db);
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                exports.STORES.forEach((storeConfig) => {
                    if (!db.objectStoreNames.contains(storeConfig.name)) {
                        const store = db.createObjectStore(storeConfig.name, {
                            keyPath: storeConfig.keyPath,
                        });
                        storeConfig.indexes?.forEach((index) => {
                            store.createIndex(index.name, index.keyPath, {
                                unique: index.unique || false,
                            });
                        });
                    }
                });
            };
        });
        return this.initPromise;
    }
    async get(storeName, key) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    async getAll(storeName) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    async query(storeName, indexName, range) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(range);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    async put(storeName, value) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(value);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    async putAll(storeName, values) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            values.forEach((value) => store.put(value));
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }
    async delete(storeName, key) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    async clear(storeName) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}
exports.IndexedDBClient = IndexedDBClient;
exports.indexedDBClient = new IndexedDBClient();

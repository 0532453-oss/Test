/**
 * IndexedDB Client for offline storage
 * 
 * Provides a typed interface for storing and retrieving data from IndexedDB.
 * Used by SyncManager to cache records and queue sync operations.
 */

const DB_NAME = 'fsm_db';
const DB_VERSION = 1;

export interface IndexedDBStore {
  name: string;
  keyPath: string;
  indexes?: Array<{
    name: string;
    keyPath: string | string[];
    unique?: boolean;
  }>;
}

export const STORES: IndexedDBStore[] = [
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

export class IndexedDBClient {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize IndexedDB database
   */
  async init(): Promise<IDBDatabase> {
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
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        STORES.forEach((storeConfig) => {
          if (!db.objectStoreNames.contains(storeConfig.name)) {
            const store = db.createObjectStore(storeConfig.name, {
              keyPath: storeConfig.keyPath,
            });

            // Create indexes
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

  /**
   * Get a value from a store
   */
  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all values from a store
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Query values from a store using an index
   */
  async query<T>(
    storeName: string,
    indexName: string,
    range?: IDBKeyRange
  ): Promise<T[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(range);

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Put a value into a store
   */
  async put<T>(storeName: string, value: T): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Put multiple values into a store
   */
  async putAll<T>(storeName: string, values: T[]): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      values.forEach((value) => store.put(value));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Delete a value from a store
   */
  async delete(storeName: string, key: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all values from a store
   */
  async clear(storeName: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
export const indexedDBClient = new IndexedDBClient();


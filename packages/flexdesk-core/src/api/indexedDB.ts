/**
 * IndexedDB Client for offline-first data storage
 */

const DB_NAME = 'service-flex-cache';
const DB_VERSION = 1;

// Store names for different entity types
const STORES = [
  'jobs',
  'customers',
  'invoices',
  'estimates',
  'technicians',
  'requests',
  'syncQueue',
] as const;

type StoreName = (typeof STORES)[number];

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize the IndexedDB database
 */
async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores for each entity type
      STORES.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });

          // Add common indexes
          if (storeName !== 'syncQueue') {
            store.createIndex('updatedAt', 'updatedAt', { unique: false });
            store.createIndex('syncStatus', 'syncStatus', { unique: false });
          }

          // Store-specific indexes
          if (storeName === 'jobs') {
            store.createIndex('customerId', 'customerId', { unique: false });
            store.createIndex('status', 'status', { unique: false });
            store.createIndex('scheduledDate', 'scheduledDate', { unique: false });
          }

          if (storeName === 'syncQueue') {
            store.createIndex('createdAt', 'createdAt', { unique: false });
            store.createIndex('status', 'status', { unique: false });
          }
        }
      });
    };
  });

  return dbPromise;
}

/**
 * Get an item from a store
 */
async function get<T>(storeName: StoreName, id: string): Promise<T | null> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

/**
 * Get all items from a store
 */
async function getAll<T>(storeName: StoreName): Promise<T[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

/**
 * Get items by index
 */
async function getByIndex<T>(
  storeName: StoreName,
  indexName: string,
  value: IDBValidKey
): Promise<T[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

/**
 * Put an item into a store (upsert)
 */
async function put<T extends { id: string }>(storeName: StoreName, item: T): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Put multiple items into a store
 */
async function putMany<T extends { id: string }>(storeName: StoreName, items: T[]): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    let completed = 0;
    let hasError = false;

    items.forEach((item) => {
      const request = store.put(item);

      request.onerror = () => {
        if (!hasError) {
          hasError = true;
          reject(request.error);
        }
      };

      request.onsuccess = () => {
        completed++;
        if (completed === items.length && !hasError) {
          resolve();
        }
      };
    });

    if (items.length === 0) {
      resolve();
    }
  });
}

/**
 * Delete an item from a store
 */
async function remove(storeName: StoreName, id: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Clear all items from a store
 */
async function clear(storeName: StoreName): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Clear all stores
 */
async function clearAll(): Promise<void> {
  await Promise.all(STORES.map((store) => clear(store)));
}

/**
 * Check if IndexedDB is available
 */
function isAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

export const indexedDBClient = {
  get,
  getAll,
  getByIndex,
  put,
  putMany,
  remove,
  clear,
  clearAll,
  isAvailable,
  initDB,
};

export type { StoreName };

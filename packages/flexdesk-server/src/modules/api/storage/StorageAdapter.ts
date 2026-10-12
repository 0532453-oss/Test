/**
 * Storage Adapter Interface
 * 
 * Abstract interface for storage implementations.
 * Allows swapping between IndexedDB, LocalStorage, or other storage backends.
 */

export interface StorageAdapter {
  get<T>(key: string): Promise<T | undefined>;
  getAll<T>(): Promise<T[]>;
  put<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}


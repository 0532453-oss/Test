export interface IndexedDBStore {
    name: string;
    keyPath: string;
    indexes?: Array<{
        name: string;
        keyPath: string | string[];
        unique?: boolean;
    }>;
}
export declare const STORES: IndexedDBStore[];
export declare class IndexedDBClient {
    private db;
    private initPromise;
    init(): Promise<IDBDatabase>;
    get<T>(storeName: string, key: string): Promise<T | undefined>;
    getAll<T>(storeName: string): Promise<T[]>;
    query<T>(storeName: string, indexName: string, range?: IDBKeyRange): Promise<T[]>;
    put<T>(storeName: string, value: T): Promise<void>;
    putAll<T>(storeName: string, values: T[]): Promise<void>;
    delete(storeName: string, key: string): Promise<void>;
    clear(storeName: string): Promise<void>;
    close(): void;
}
export declare const indexedDBClient: IndexedDBClient;

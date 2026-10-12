export interface ApiRequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: any;
    headers?: Record<string, string>;
    optimistic?: OptimisticUpdate;
    skipCache?: boolean;
}
export interface OptimisticUpdate<T = any> {
    update: (current: T | undefined) => T;
    rollback?: (previous: T | undefined) => void;
    entityType?: string;
    entityId?: string;
}
export interface ApiResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
}
export declare class ApiClient {
    private baseURL;
    private defaultHeaders;
    constructor(baseURL?: string);
    setAuthToken(token: string): void;
    setWorkspaceId(workspaceId: string): void;
    request<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>>;
    private queueOfflineOperation;
    private getOperationType;
    private extractEntityType;
    private extractEntityId;
    private getFromCache;
    private updateCache;
    private fetchInBackground;
    get<T = any>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>): Promise<ApiResponse<T>>;
    post<T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>>;
    put<T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>>;
    patch<T = any>(endpoint: string, body?: any, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>>;
    delete<T = any>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>): Promise<ApiResponse<T>>;
}
export declare const apiClient: ApiClient;

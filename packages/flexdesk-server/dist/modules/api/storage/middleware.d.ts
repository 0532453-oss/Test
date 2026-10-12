interface MiddlewareArgs {
    where?: Record<string, unknown>;
    data?: Record<string, unknown> | Record<string, unknown>[];
    create?: Record<string, unknown>;
    update?: Record<string, unknown>;
    [key: string]: unknown;
}
type MiddlewareParams = {
    model?: string;
    action: string;
    args: MiddlewareArgs;
    dataPath: string[];
    runInTransaction: boolean;
};
type MiddlewareNext = (params: MiddlewareParams) => Promise<unknown>;
export declare function setWorkspaceContext(workspaceId: string | null): void;
export declare function getWorkspaceContext(): string | null;
export declare const workspaceMiddleware: (params: MiddlewareParams, next: MiddlewareNext) => Promise<unknown>;
export declare function createWorkspaceInterceptor(): {
    intercept: (context: any, next: any) => any;
};
export {};

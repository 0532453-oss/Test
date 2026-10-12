export declare function runWithWorkspace<T>(workspaceId: string | null, fn: () => T): T;
export declare function setWorkspaceContext(workspaceId: string | null): void;
export declare function getWorkspaceId(): string | null;

export declare const JOB_ENDPOINTS: {
    readonly LIST: "/api/jobs";
    readonly DETAIL: (id: string) => string;
    readonly CREATE: "/api/jobs";
    readonly UPDATE: (id: string) => string;
    readonly UPDATE_STATUS: (id: string) => string;
    readonly DELETE: (id: string) => string;
    readonly SYNC: "/api/jobs/sync";
};

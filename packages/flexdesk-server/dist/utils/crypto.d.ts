export interface JobTokenPayload {
    jobId: string;
    workspaceId: string;
    exp: number;
}
export interface CustomerPortalTokenPayload {
    customerId: string;
    workspaceId: string;
    exp: number;
}
export declare function signJobToken(payload: JobTokenPayload): string;
export declare function verifyJobToken(token: string): JobTokenPayload | null;
export declare function signCustomerPortalToken(payload: CustomerPortalTokenPayload): string;
export declare function verifyCustomerPortalToken(token: string): CustomerPortalTokenPayload | null;

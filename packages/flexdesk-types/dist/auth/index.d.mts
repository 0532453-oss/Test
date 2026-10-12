/**
 * Authentication and user types
 */
interface JwtPayload {
    sub: string;
    email: string;
    workspaceId: string;
    role: string;
    iat: number;
    exp: number;
}
interface AuthenticatedUser {
    id: string;
    email: string;
    name: string;
    workspaceId: string;
    role: string;
    avatarUrl?: string | null;
}
interface LoginCredentials {
    email: string;
    password: string;
}
interface LoginResponse {
    access_token: string;
    refresh_token?: string;
    user: AuthenticatedUser;
    expiresIn: number;
}
interface RefreshTokenResponse {
    access_token: string;
    expiresIn: number;
}
interface Workspace {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}
declare const UserRole: {
    readonly OWNER: "OWNER";
    readonly ADMIN: "ADMIN";
    readonly MEMBER: "MEMBER";
};
type UserRole = (typeof UserRole)[keyof typeof UserRole];
interface UserPermissions {
    canManageWorkspace: boolean;
    canManageUsers: boolean;
    canManageJobs: boolean;
    canManageCustomers: boolean;
    canManageInvoices: boolean;
    canViewReports: boolean;
}
declare function getRolePermissions(role: UserRole): UserPermissions;

export { type AuthenticatedUser, type JwtPayload, type LoginCredentials, type LoginResponse, type RefreshTokenResponse, type UserPermissions, UserRole, type Workspace, getRolePermissions };

/**
 * Authentication and user types
 */

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  workspaceId: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  workspaceId: string;
  role: string;
  avatarUrl?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  user: AuthenticatedUser;
  expiresIn: number;
}

export interface RefreshTokenResponse {
  access_token: string;
  expiresIn: number;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Permission constants
export const UserRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface UserPermissions {
  canManageWorkspace: boolean;
  canManageUsers: boolean;
  canManageJobs: boolean;
  canManageCustomers: boolean;
  canManageInvoices: boolean;
  canViewReports: boolean;
}

export function getRolePermissions(role: UserRole): UserPermissions {
  switch (role) {
    case UserRole.OWNER:
      return {
        canManageWorkspace: true,
        canManageUsers: true,
        canManageJobs: true,
        canManageCustomers: true,
        canManageInvoices: true,
        canViewReports: true,
      };
    case UserRole.ADMIN:
      return {
        canManageWorkspace: false,
        canManageUsers: true,
        canManageJobs: true,
        canManageCustomers: true,
        canManageInvoices: true,
        canViewReports: true,
      };
    case UserRole.MEMBER:
      return {
        canManageWorkspace: false,
        canManageUsers: false,
        canManageJobs: true,
        canManageCustomers: true,
        canManageInvoices: false,
        canViewReports: false,
      };
    default:
      return {
        canManageWorkspace: false,
        canManageUsers: false,
        canManageJobs: false,
        canManageCustomers: false,
        canManageInvoices: false,
        canViewReports: false,
      };
  }
}

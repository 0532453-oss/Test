/**
 * React hook for authentication state management
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AuthenticatedUser, UserPermissions, UserRole } from '@service-flex/types';
import { getRolePermissions } from '@service-flex/types';
import { tokenStorage } from './storage';

export interface UseAuthState {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: UserPermissions | null;
  workspaceId: string | null;
}

export interface UseAuthActions {
  setUser: (user: AuthenticatedUser) => void;
  clearUser: () => void;
  refreshUser: () => Promise<void>;
}

export interface UseAuthReturn extends UseAuthState, UseAuthActions {}

export interface UseAuthConfig {
  apiUrl?: string;
  identityEndpoint?: string;
}

/**
 * Hook for accessing and managing authentication state
 */
export function useAuth(config?: UseAuthConfig): UseAuthReturn {
  const [user, setUserState] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const apiUrl = config?.apiUrl || '';
  const identityEndpoint = config?.identityEndpoint || '/auth/me';

  // Load initial auth state from storage
  useEffect(() => {
    const storedUser = tokenStorage.getUser<AuthenticatedUser>();
    if (storedUser) {
      setUserState(storedUser);
    }
    setIsLoading(false);
  }, []);

  const isAuthenticated = useMemo(() => {
    return !!user && !!tokenStorage.getAccessToken();
  }, [user]);

  const permissions = useMemo(() => {
    if (!user?.role) return null;
    return getRolePermissions(user.role as UserRole);
  }, [user?.role]);

  const workspaceId = useMemo(() => {
    return user?.workspaceId || tokenStorage.getWorkspaceId();
  }, [user?.workspaceId]);

  const setUser = useCallback((newUser: AuthenticatedUser) => {
    setUserState(newUser);
    tokenStorage.setUser(newUser);
    if (newUser.workspaceId) {
      tokenStorage.setWorkspaceId(newUser.workspaceId);
    }
  }, []);

  const clearUser = useCallback(() => {
    setUserState(null);
    tokenStorage.clearAll();
  }, []);

  const refreshUser = useCallback(async () => {
    const token = tokenStorage.getAccessToken();
    if (!token || !apiUrl) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}${identityEndpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const freshUser: AuthenticatedUser = await response.json();
        setUser(freshUser);
      }
    } catch {
      // Ignore refresh errors - keep existing user
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, identityEndpoint, setUser]);

  return {
    user,
    isAuthenticated,
    isLoading,
    permissions,
    workspaceId,
    setUser,
    clearUser,
    refreshUser,
  };
}

/**
 * Hook for checking specific permissions
 */
export function usePermission(permission: keyof UserPermissions): boolean {
  const { permissions } = useAuth();
  return permissions?.[permission] ?? false;
}

/**
 * Hook for getting the current access token
 */
export function useAccessToken(): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(tokenStorage.getAccessToken());
  }, []);

  return token;
}

/**
 * Hook for getting the current workspace ID
 */
export function useWorkspaceId(): string | null {
  const { workspaceId } = useAuth();
  return workspaceId;
}

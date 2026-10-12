/**
 * Auth context & provider — manages auth state for the entire app.
 *
 * On app launch the provider checks Keychain for stored tokens, validates
 * them against GET /auth/me, and exposes the authenticated user (or null)
 * through React context.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import apiClient from '../api/client';
import { getTokens, setTokens, clearTokens } from './tokenStorage';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  workspaceId: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Fetch the current user profile from the server. */
  const fetchMe = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const { data } = await apiClient.get<AuthUser>('/auth/me');
      return data;
    } catch {
      return null;
    }
  }, []);

  /** Try to refresh the access token using the stored refresh token. */
  const tryRefresh = useCallback(async (refreshToken: string): Promise<boolean> => {
    try {
      const { data } = await apiClient.post<{
        access_token?: string;
        refresh_token?: string;
        accessToken?: string;
        refreshToken?: string;
      }>('/auth/refresh', { refreshToken });

      const newAccess = data.access_token ?? data.accessToken;
      const newRefresh = data.refresh_token ?? data.refreshToken;

      if (!newAccess) return false;

      await setTokens(newAccess, newRefresh ?? refreshToken);
      return true;
    } catch {
      return false;
    }
  }, []);

  /** Bootstrap: check stored tokens and resolve auth state. */
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const { accessToken, refreshToken } = await getTokens();

        if (!accessToken && !refreshToken) {
          // No tokens → not authenticated
          return;
        }

        // Try fetching user with current access token
        if (accessToken) {
          const me = await fetchMe();
          if (!cancelled && me) {
            setUser(me);
            return;
          }
        }

        // Access token expired/invalid — attempt refresh
        if (refreshToken) {
          const refreshed = await tryRefresh(refreshToken);
          if (refreshed && !cancelled) {
            const me = await fetchMe();
            if (!cancelled && me) {
              setUser(me);
              return;
            }
          }
        }

        // All attempts failed — clear stale tokens
        await clearTokens();
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [fetchMe, tryRefresh]);

  /** Store tokens, fetch user profile, and set authenticated state. */
  const login = useCallback(
    async (accessToken: string, refreshToken: string) => {
      await setTokens(accessToken, refreshToken);
      const me = await fetchMe();
      if (me) {
        setUser(me);
      } else {
        // fetchMe failed — tokens are invalid, clear them to avoid stuck state
        await clearTokens();
        throw new Error('Failed to fetch user profile after login.');
      }
    },
    [fetchMe],
  );

  /** Log out: notify server, clear tokens, reset state. */
  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore — we still clear local state
    }
    await clearTokens();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

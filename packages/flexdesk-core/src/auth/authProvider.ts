/**
 * React Admin compatible AuthProvider
 * Provides authentication methods for login, logout, and identity management
 */

import type {
  AuthenticatedUser,
  LoginCredentials,
  LoginResponse,
} from '@service-flex/types';
import { tokenStorage } from './storage';

export interface AuthProviderConfig {
  apiUrl: string;
  loginEndpoint?: string;
  logoutEndpoint?: string;
  refreshEndpoint?: string;
  identityEndpoint?: string;
}

export interface AuthProvider {
  login: (params: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  checkError: (error: { status?: number }) => Promise<void>;
  getIdentity: () => Promise<AuthenticatedUser>;
  getPermissions: () => Promise<string>;
  handleCallback: () => Promise<void>;
}

/**
 * Creates a React Admin compatible AuthProvider
 */
export function createAuthProvider(config: AuthProviderConfig): AuthProvider {
  const {
    apiUrl,
    loginEndpoint = '/auth/login',
    logoutEndpoint = '/auth/logout',
    refreshEndpoint = '/auth/refresh',
    identityEndpoint = '/auth/me',
  } = config;

  const baseUrl = apiUrl.replace(/\/$/, '');

  /**
   * Attempt to refresh the access token
   */
  async function refreshToken(): Promise<boolean> {
    try {
      // Refresh token is sent automatically via httpOnly cookie
      const response = await fetch(`${baseUrl}${refreshEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      tokenStorage.setAccessToken(data.access_token);
      return true;
    } catch {
      return false;
    }
  }

  return {
    /**
     * Login with email and password
     */
    async login(params: LoginCredentials): Promise<void> {
      const response = await fetch(`${baseUrl}${loginEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Invalid credentials');
      }

      const data: LoginResponse = await response.json();

      tokenStorage.setAccessToken(data.access_token);
      tokenStorage.setUser(data.user);
      if (data.user.workspaceId) {
        tokenStorage.setWorkspaceId(data.user.workspaceId);
      }
    },

    /**
     * Logout and clear tokens
     */
    async logout(): Promise<void> {
      const token = tokenStorage.getAccessToken();

      // Try to call logout endpoint if we have a token
      if (token) {
        try {
          await fetch(`${baseUrl}${logoutEndpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            credentials: 'include',
          });
        } catch {
          // Ignore logout API errors
        }
      }

      tokenStorage.clearAll();
    },

    /**
     * Check if user is authenticated
     */
    async checkAuth(): Promise<void> {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Optionally validate token with server
      try {
        const response = await fetch(`${baseUrl}${identityEndpoint}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          // Try to refresh token
          const refreshed = await refreshToken();
          if (!refreshed) {
            tokenStorage.clearAll();
            throw new Error('Session expired');
          }
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'Session expired') {
          throw error;
        }
        // Network error - allow offline access if token exists
      }
    },

    /**
     * Check for authentication errors in API responses
     */
    async checkError(error: { status?: number }): Promise<void> {
      if (error.status === 401) {
        // Try to refresh token
        const refreshed = await refreshToken();
        if (!refreshed) {
          tokenStorage.clearAll();
          throw new Error('Session expired');
        }
      }
      if (error.status === 403) {
        throw new Error('Forbidden');
      }
    },

    /**
     * Get the current user identity
     */
    async getIdentity(): Promise<AuthenticatedUser> {
      // Try cached user first
      const cachedUser = tokenStorage.getUser<AuthenticatedUser>();
      const token = tokenStorage.getAccessToken();

      if (!token) {
        throw new Error('Not authenticated');
      }

      // Fetch fresh user data
      try {
        const response = await fetch(`${baseUrl}${identityEndpoint}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (response.ok) {
          const user: AuthenticatedUser = await response.json();
          tokenStorage.setUser(user);
          return user;
        }
      } catch {
        // Network error - return cached user if available
      }

      if (cachedUser) {
        return cachedUser;
      }

      throw new Error('Unable to get user identity');
    },

    /**
     * Get user permissions/role
     */
    async getPermissions(): Promise<string> {
      const user = tokenStorage.getUser<AuthenticatedUser>();
      return user?.role || 'user';
    },

    /**
     * Handle OAuth callback - exchange code for tokens
     */
    async handleCallback(): Promise<void> {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (!code) {
        throw new Error('No authorization code found');
      }

      // Exchange code for tokens (refresh token set as httpOnly cookie by server)
      const response = await fetch(`${baseUrl}/auth/exchange-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to exchange authorization code');
      }

      const tokens = await response.json();
      tokenStorage.setAccessToken(tokens.access_token);

      // Fetch user identity
      const userResponse = await fetch(`${baseUrl}${identityEndpoint}`, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
        credentials: 'include',
      });

      if (userResponse.ok) {
        const user: AuthenticatedUser = await userResponse.json();
        tokenStorage.setUser(user);
        if (user.workspaceId) {
          tokenStorage.setWorkspaceId(user.workspaceId);
        }
      }
    },
  };
}

// Export token storage for direct access
export { tokenStorage };

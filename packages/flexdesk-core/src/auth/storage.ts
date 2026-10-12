/**
 * Token storage abstraction
 * Provides a consistent interface for storing and retrieving auth tokens
 */

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';
const WORKSPACE_ID_KEY = 'workspace_id';

export interface TokenStorage {
  getAccessToken(): string | null;
  setAccessToken(token: string): void;
  removeAccessToken(): void;

  /** @deprecated Refresh token is now managed via httpOnly cookie */
  getRefreshToken(): string | null;
  /** @deprecated Refresh token is now managed via httpOnly cookie */
  setRefreshToken(token: string): void;
  /** @deprecated Refresh token is now managed via httpOnly cookie */
  removeRefreshToken(): void;

  getUser<T>(): T | null;
  setUser<T>(user: T): void;
  removeUser(): void;

  getWorkspaceId(): string | null;
  setWorkspaceId(workspaceId: string): void;
  removeWorkspaceId(): void;

  clearAll(): void;
}

/**
 * LocalStorage-based token storage implementation
 */
class LocalTokenStorage implements TokenStorage {
  private isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  getAccessToken(): string | null {
    if (!this.isAvailable()) return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  setAccessToken(token: string): void {
    if (!this.isAvailable()) return;
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  removeAccessToken(): void {
    if (!this.isAvailable()) return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    // Refresh token is now managed via httpOnly cookie - no longer stored in localStorage
    return null;
  }

  setRefreshToken(_token: string): void {
    // Refresh token is now managed via httpOnly cookie - no longer stored in localStorage
    // Clear any legacy value that may exist
    if (this.isAvailable()) {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }

  removeRefreshToken(): void {
    if (!this.isAvailable()) return;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  getUser<T>(): T | null {
    if (!this.isAvailable()) return null;
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson) as T;
    } catch {
      return null;
    }
  }

  setUser<T>(user: T): void {
    if (!this.isAvailable()) return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  removeUser(): void {
    if (!this.isAvailable()) return;
    localStorage.removeItem(USER_KEY);
  }

  getWorkspaceId(): string | null {
    if (!this.isAvailable()) return null;
    return localStorage.getItem(WORKSPACE_ID_KEY);
  }

  setWorkspaceId(workspaceId: string): void {
    if (!this.isAvailable()) return;
    localStorage.setItem(WORKSPACE_ID_KEY, workspaceId);
  }

  removeWorkspaceId(): void {
    if (!this.isAvailable()) return;
    localStorage.removeItem(WORKSPACE_ID_KEY);
  }

  clearAll(): void {
    this.removeAccessToken();
    this.removeRefreshToken();
    this.removeUser();
    this.removeWorkspaceId();
  }
}

/**
 * In-memory storage fallback (for SSR or when localStorage unavailable)
 */
class MemoryTokenStorage implements TokenStorage {
  private accessToken: string | null = null;
  private user: unknown = null;
  private workspaceId: string | null = null;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  removeAccessToken(): void {
    this.accessToken = null;
  }

  getRefreshToken(): string | null {
    // Refresh token is now managed via httpOnly cookie
    return null;
  }

  setRefreshToken(_token: string): void {
    // Refresh token is now managed via httpOnly cookie
  }

  removeRefreshToken(): void {
    // No-op: refresh token is now managed via httpOnly cookie
  }

  getUser<T>(): T | null {
    return this.user as T | null;
  }

  setUser<T>(user: T): void {
    this.user = user;
  }

  removeUser(): void {
    this.user = null;
  }

  getWorkspaceId(): string | null {
    return this.workspaceId;
  }

  setWorkspaceId(workspaceId: string): void {
    this.workspaceId = workspaceId;
  }

  removeWorkspaceId(): void {
    this.workspaceId = null;
  }

  clearAll(): void {
    this.accessToken = null;
    this.user = null;
    this.workspaceId = null;
  }
}

// Export singleton instance
export const tokenStorage: TokenStorage = typeof window !== 'undefined'
  ? new LocalTokenStorage()
  : new MemoryTokenStorage();

// Export for custom implementations
export { LocalTokenStorage, MemoryTokenStorage };

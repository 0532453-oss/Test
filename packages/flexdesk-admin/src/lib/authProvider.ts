import type { AuthProvider, UserIdentity } from "ra-core";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/+$/, "");

const AUTH_BASE = `${API_URL}/api/v1/auth`;

interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  role: string;
  workspaceId: string;
  avatarUrl?: string;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function setToken(token: string): void {
  localStorage.setItem("token", token);
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}

function setRefreshToken(token: string): void {
  localStorage.setItem("refreshToken", token);
}

function clearTokens(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userIdentity");
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // Consider expired if less than 60 seconds remaining
    return payload.exp * 1000 < Date.now() + 60_000;
  } catch {
    return true;
  }
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  const response = await fetch(`${AUTH_BASE}/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
    credentials: "include",
  });

  if (!response.ok) {
    clearTokens();
    throw new Error("Token refresh failed");
  }

  const data: TokenResponse = await response.json();
  setToken(data.access_token);
  setRefreshToken(data.refresh_token);
  return data.access_token;
}

export const authProvider: AuthProvider = {
  /**
   * Login with email/password or handle Google OAuth code exchange
   */
  async login(params: { email?: string; password?: string; code?: string }) {
    // Google OAuth code exchange flow
    if (params.code) {
      const response = await fetch(`${AUTH_BASE}/exchange-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: params.code }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to exchange authorization code");
      }

      const data: TokenResponse = await response.json();
      setToken(data.access_token);
      setRefreshToken(data.refresh_token);
      return;
    }

    // Email/password login
    const response = await fetch(`${AUTH_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: params.email,
        password: params.password,
      }),
    });

    if (!response.ok) {
      throw new Error(
        response.status === 401
          ? "Invalid email or password"
          : "Login failed",
      );
    }

    const data: TokenResponse = await response.json();
    setToken(data.access_token);
    setRefreshToken(data.refresh_token);
  },

  /**
   * Logout the user
   */
  async logout() {
    const token = getToken();
    if (token) {
      try {
        await fetch(`${AUTH_BASE}/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });
      } catch {
        // Ignore logout API errors; clear local state regardless
      }
    }
    clearTokens();
  },

  /**
   * Check if user is authenticated; refresh token if expired
   */
  async checkAuth() {
    const token = getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    if (isTokenExpired(token)) {
      await refreshAccessToken();
    }
  },

  /**
   * Handle API errors — redirect to login on 401/403
   */
  async checkError(error: { status?: number }) {
    if (error.status === 401 || error.status === 403) {
      // Try refreshing the token first
      try {
        await refreshAccessToken();
        return;
      } catch {
        clearTokens();
        throw new Error("Session expired");
      }
    }
  },

  /**
   * Get user identity for the admin header/avatar
   */
  async getIdentity(): Promise<UserIdentity> {
    const cached = localStorage.getItem("userIdentity");
    if (cached) {
      try {
        return JSON.parse(cached) as UserIdentity;
      } catch {
        // Fall through to fetch
      }
    }

    let token = getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    if (isTokenExpired(token)) {
      token = await refreshAccessToken();
    }

    const response = await fetch(`${AUTH_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user info");
    }

    const user: UserInfo = await response.json();
    const identity: UserIdentity = {
      id: user.id,
      fullName: user.fullName,
      avatar: user.avatarUrl,
    };

    localStorage.setItem("userIdentity", JSON.stringify(identity));
    return identity;
  },
};

/**
 * Get the current access token, refreshing if needed.
 * Used by the data provider to attach Authorization header.
 */
export async function getAccessToken(): Promise<string | null> {
  let token = getToken();
  if (!token) return null;

  if (isTokenExpired(token)) {
    try {
      token = await refreshAccessToken();
    } catch {
      return null;
    }
  }

  return token;
}

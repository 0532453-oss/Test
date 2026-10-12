/**
 * Centralized Axios API client with JWT auth interceptor.
 *
 * - Attaches Bearer token from Keychain to every request.
 * - Catches 401, refreshes the token, and retries the original request.
 * - Queues concurrent 401s so only one refresh call fires.
 * - On refresh failure, clears tokens and navigates to Login.
 */

import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import Config from 'react-native-config';
import { getTokens, setTokens, clearTokens } from '../auth/tokenStorage';

// Navigation ref — set by the auth navigator so we can redirect on token expiry.
let navigateToLogin: (() => void) | null = null;

export function setNavigateToLogin(fn: () => void): void {
  navigateToLogin = fn;
}

// ── Axios instance ──────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT = 15_000;

function resolveBaseURL(): string {
  const url = Config.API_URL ?? 'http://localhost:3001/api/v1';
  if (!__DEV__ && !url.startsWith('https://')) {
    throw new Error(
      `API_URL must use HTTPS in production builds. Got: ${url}`,
    );
  }
  return url;
}

const apiClient = axios.create({
  baseURL: resolveBaseURL(),
  timeout: DEFAULT_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach access token ───────────────────────────────

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { accessToken } = await getTokens();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ── Response interceptor — handle 401 + token refresh ───────────────────────

type QueueItem = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

let isRefreshing = false;
let refreshQueue: QueueItem[] = [];

function processQueue(error: unknown, token: string | null): void {
  for (const item of refreshQueue) {
    if (error || !token) {
      item.reject(error);
    } else {
      item.resolve(token);
    }
  }
  refreshQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If a refresh is already in progress, queue this request.
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { refreshToken } = await getTokens();
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      // Call refresh endpoint directly (not through apiClient to avoid interceptor loop).
      const baseURL = resolveBaseURL();
      const { data } = await axios.post<{
        access_token?: string;
        refresh_token?: string;
        accessToken?: string;
        refreshToken?: string;
      }>(
        `${baseURL}/auth/refresh`,
        { refreshToken },
        { timeout: DEFAULT_TIMEOUT },
      );

      const newAccessToken = data.access_token ?? data.accessToken;
      const newRefreshToken = data.refresh_token ?? data.refreshToken;

      if (!newAccessToken) {
        throw new Error('Refresh response missing access token');
      }

      await setTokens(newAccessToken, newRefreshToken ?? refreshToken);
      processQueue(null, newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await clearTokens();
      navigateToLogin?.();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;

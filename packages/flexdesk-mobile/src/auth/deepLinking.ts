/**
 * Deep link handling for Google OAuth callback.
 *
 * Flow:
 *   1. User taps "Sign in with Google" → system browser opens GET /auth/google
 *   2. After Google auth, server redirects to flexdesk://auth/callback?code=XXXX
 *   3. This module captures the deep link, extracts the one-time code
 *   4. Calls POST /auth/exchange-code to swap the code for JWT tokens
 *   5. Stores tokens in Keychain
 */

import { Linking } from 'react-native';
import apiClient from '../api/client';
import { setTokens } from './tokenStorage';

const DEEP_LINK_PREFIX = 'flexdesk://auth/callback';

/** Optional login callback — set by RootNavigator to update auth context. */
let onLoginSuccess: ((accessToken: string, refreshToken: string) => Promise<void>) | null = null;

export function setDeepLinkLoginHandler(
  handler: (accessToken: string, refreshToken: string) => Promise<void>,
): void {
  onLoginSuccess = handler;
}

export interface DeepLinkResult {
  success: boolean;
  error?: string;
}

/**
 * Parse a deep link URL and extract the OAuth authorization code.
 * Returns null if the URL is not a valid OAuth callback.
 */
export function extractOAuthCode(url: string): string | null {
  if (!url.startsWith(DEEP_LINK_PREFIX)) {
    return null;
  }

  const queryStart = url.indexOf('?');
  if (queryStart === -1) {
    return null;
  }

  const params = new URLSearchParams(url.substring(queryStart));
  return params.get('code') ?? null;
}

/**
 * Exchange a one-time OAuth code for JWT tokens and store them in Keychain.
 */
export async function exchangeOAuthCode(code: string): Promise<DeepLinkResult> {
  try {
    const { data } = await apiClient.post<{
      access_token?: string;
      refresh_token?: string;
      accessToken?: string;
      refreshToken?: string;
    }>('/auth/exchange-code', { code });

    const accessToken = data.access_token ?? data.accessToken;
    const refreshToken = data.refresh_token ?? data.refreshToken;

    if (!accessToken) {
      return { success: false, error: 'No access token received from server.' };
    }

    if (!refreshToken) {
      return { success: false, error: 'Server did not provide a refresh token.' };
    }

    if (onLoginSuccess) {
      await onLoginSuccess(accessToken, refreshToken);
    } else {
      await setTokens(accessToken, refreshToken);
    }
    return { success: true };
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 400 || status === 401) {
      return { success: false, error: 'Google sign-in failed. Please try again.' };
    }
    return { success: false, error: 'Unable to connect. Please check your network and try again.' };
  }
}

/**
 * Handle an incoming deep link URL. If it's an OAuth callback, exchange the
 * code for tokens.
 *
 * Returns a DeepLinkResult if the URL was an OAuth callback, null otherwise.
 */
export async function handleDeepLink(url: string): Promise<DeepLinkResult | null> {
  const code = extractOAuthCode(url);
  if (!code) {
    return null;
  }
  return exchangeOAuthCode(code);
}

/**
 * Get the initial deep link that launched the app (cold start from notification/link).
 */
export async function getInitialDeepLink(): Promise<string | null> {
  return Linking.getInitialURL();
}

/**
 * Auth API functions.
 *
 * Endpoints for login, register, OAuth code exchange, token refresh,
 * user profile, and logout.
 */

import apiClient from './client';
import type {
  AuthUser,
  ExchangeCodeRequest,
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
} from './types';

/** Log in with email and password. */
export async function login(req: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', req);
  return data;
}

/** Register a new user account. */
export async function register(req: RegisterRequest): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>('/auth/register', req);
  return data;
}

/** Exchange a one-time OAuth code for auth tokens. */
export async function exchangeCode(req: ExchangeCodeRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/exchange-code', req);
  return data;
}

/** Refresh the access token using a refresh token. */
export async function refresh(req: RefreshRequest): Promise<RefreshResponse> {
  const { data } = await apiClient.post<RefreshResponse>('/auth/refresh', req);
  return data;
}

/** Get the currently authenticated user's profile. */
export async function getMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>('/auth/me');
  return data;
}

/** Log out and invalidate the current session. */
export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

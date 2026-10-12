/**
 * Environment configuration utility
 * Supports both Vite (VITE_*) and Next.js (NEXT_PUBLIC_*) prefixes
 */

type EnvSource = 'vite' | 'nextjs' | 'process' | 'unknown';

interface EnvConfig {
  apiUrl: string;
  wsUrl: string;
  appEnv: 'development' | 'staging' | 'production';
  debug: boolean;
}

// Safely access import.meta.env for Vite environments
function getViteEnv(): Record<string, string | undefined> | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = (globalThis as any).import?.meta;
    return meta?.env;
  } catch {
    return undefined;
  }
}

/**
 * Safely get environment variable from various sources
 */
function getEnvVar(key: string): string | undefined {
  // Check Vite environment
  const viteEnv = getViteEnv();
  if (viteEnv) {
    const viteKey = `VITE_${key}`;
    if (viteEnv[viteKey]) {
      return viteEnv[viteKey];
    }
  }

  // Check Next.js / Node process.env
  if (typeof process !== 'undefined' && process.env) {
    // Next.js public env vars
    const nextPublicKey = `NEXT_PUBLIC_${key}`;
    if (process.env[nextPublicKey]) {
      return process.env[nextPublicKey];
    }

    // Direct env var (server-side)
    if (process.env[key]) {
      return process.env[key];
    }
  }

  return undefined;
}

/**
 * Detect which environment source is being used
 */
function detectEnvSource(): EnvSource {
  const viteEnv = getViteEnv();
  if (viteEnv?.VITE_API_URL) {
    return 'vite';
  }
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    return 'nextjs';
  }
  if (typeof process !== 'undefined' && process.env?.API_URL) {
    return 'process';
  }
  return 'unknown';
}

/**
 * Default configuration values for local development
 */
const defaults: EnvConfig = {
  apiUrl: 'http://localhost:3001/api/v1',
  wsUrl: 'ws://localhost:3001',
  appEnv: 'development',
  debug: true,
};

/**
 * Get the full environment configuration
 */
export function getEnvConfig(): EnvConfig {
  const apiUrl = getEnvVar('API_URL') || defaults.apiUrl;
  const wsUrl = getEnvVar('WS_URL') || apiUrl.replace(/^http/, 'ws').replace(/\/api\/v1$/, '');
  const appEnvRaw = getEnvVar('APP_ENV') || getEnvVar('NODE_ENV') || defaults.appEnv;
  const appEnv = (['development', 'staging', 'production'].includes(appEnvRaw)
    ? appEnvRaw
    : 'development') as EnvConfig['appEnv'];
  const debug = getEnvVar('DEBUG') === 'true' || appEnv === 'development';

  return {
    apiUrl,
    wsUrl,
    appEnv,
    debug,
  };
}

/**
 * Get specific environment config value
 */
export function getApiUrl(): string {
  return getEnvConfig().apiUrl;
}

export function getWsUrl(): string {
  return getEnvConfig().wsUrl;
}

export function getAppEnv(): EnvConfig['appEnv'] {
  return getEnvConfig().appEnv;
}

export function isDebug(): boolean {
  return getEnvConfig().debug;
}

export function isProduction(): boolean {
  return getEnvConfig().appEnv === 'production';
}

export function isDevelopment(): boolean {
  return getEnvConfig().appEnv === 'development';
}

// Export for testing
export { detectEnvSource, getEnvVar, defaults };
export type { EnvConfig, EnvSource };

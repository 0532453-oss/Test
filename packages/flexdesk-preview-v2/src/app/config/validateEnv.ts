import { isDemoMode } from '@/mocks/demoMode'

interface EnvValidationResult {
  valid: boolean
  missing: string[]
}

/**
 * Validates that required environment variables are set.
 * In demo mode, VITE_API_URL is not required.
 * Returns validation result with list of missing variables.
 */
export function validateEnv(): EnvValidationResult {
  const missing: string[] = []

  if (!import.meta.env.VITE_API_URL && !isDemoMode()) {
    missing.push('VITE_API_URL')
  }

  if (missing.length > 0) {
    console.error(
      `[FlexDesk] Missing required environment variables: ${missing.join(', ')}`,
    )
  }

  return { valid: missing.length === 0, missing }
}

/**
 * Renders a user-friendly error screen when env validation fails.
 * Replaces the app root content with an error message.
 */
export function renderEnvError(missing: string[]): void {
  const root = document.getElementById('root')
  if (!root) return

  root.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 480px; padding: 32px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center;">
        <h1 style="margin: 0 0 12px; font-size: 24px; color: #111827;">Configuration Error</h1>
        <p style="margin: 0 0 20px; color: #6b7280; font-size: 16px;">FlexDesk could not start because required environment variables are missing.</p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; text-align: left; margin-bottom: 20px;">
          <p style="margin: 0 0 8px; font-weight: 600; color: #991b1b; font-size: 14px;">Missing variables:</p>
          <ul style="margin: 0; padding-left: 20px; color: #dc2626; font-size: 14px;">
            ${missing.map((v) => `<li>${v}</li>`).join('')}
          </ul>
        </div>
        <p style="margin: 0; color: #9ca3af; font-size: 13px;">Check your <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">.env</code> file or deployment configuration.</p>
      </div>
    </div>
  `
}

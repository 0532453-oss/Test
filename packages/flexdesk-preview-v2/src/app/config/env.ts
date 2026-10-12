export const env = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'FlexDesk',
  USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA === 'true',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const

// VITE_API_URL is enforced at build time by the envValidationPlugin in vite.config.ts.
// Production builds will fail if VITE_API_URL is not set.

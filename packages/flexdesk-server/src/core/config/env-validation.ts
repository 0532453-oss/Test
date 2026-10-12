/**
 * Pre-bootstrap environment validation.
 * Runs before NestFactory.create() to fail fast with a clear error
 * listing ALL missing required environment variables.
 */
export function validateRequiredEnv(): void {
  const missing: string[] = [];

  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JOB_TOKEN_SECRET',
    'CUSTOMER_PORTAL_SECRET',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Conditionally required in production
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.CORS_ORIGIN) {
      missing.push('CORS_ORIGIN');
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  - ${missing.join('\n  - ')}\n\nSet these variables before starting the server.`,
    );
  }
}

import * as Sentry from '@sentry/nestjs';

// Initialize Sentry only if SENTRY_DSN is configured
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.RAILWAY_GIT_COMMIT_SHA || 'local',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
} else {
  console.warn('[Sentry] SENTRY_DSN is not set — error tracking is disabled');
}

import { Global, Module } from '@nestjs/common';
import { SentryModule as SentryNestModule } from '@sentry/nestjs/setup';

/**
 * Global Sentry module for error tracking.
 *
 * Sentry.init() is called in `src/instrument.ts` (must run before all other imports).
 * This module registers the @sentry/nestjs integration with the NestJS DI container.
 *
 * Configuration (via environment variables in instrument.ts):
 * - SENTRY_DSN: Required to enable Sentry. If unset, a warning is logged and Sentry is disabled.
 * - RAILWAY_GIT_COMMIT_SHA: Used as the Sentry release identifier (falls back to 'local').
 * - NODE_ENV: Used as the Sentry environment (falls back to 'development').
 */
@Global()
@Module({
  imports: [SentryNestModule.forRoot()],
  exports: [SentryNestModule],
})
export class SentryModule {}

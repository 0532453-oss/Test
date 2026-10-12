/**
 * FlexDesk Analytics
 *
 * Central analytics service with pluggable providers.
 *
 * Usage:
 *   import { analyticsService, ConsoleAnalyticsProvider } from '@service-flex/analytics';
 *   analyticsService.addProvider(new ConsoleAnalyticsProvider());
 *   analyticsService.track(createJobCompletionEvent({ ... }));
 */

import { AnalyticsEvent, AnalyticsProvider } from './providers';

// Re-export everything
export * from './providers';
export * from './events/job-completion';
export * from './events/quote-acceptance';
export * from './events/technician-location';

class AnalyticsService {
  private providers: AnalyticsProvider[] = [];

  addProvider(provider: AnalyticsProvider): void {
    this.providers.push(provider);
  }

  removeProvider(name: string): void {
    this.providers = this.providers.filter((p) => p.name !== name);
  }

  getProviders(): string[] {
    return this.providers.map((p) => p.name);
  }

  async track(event: AnalyticsEvent): Promise<void> {
    await Promise.allSettled(
      this.providers.map((provider) => provider.track(event)),
    );
  }

  async flush(): Promise<void> {
    await Promise.allSettled(
      this.providers
        .filter((p) => p.flush)
        .map((p) => p.flush!()),
    );
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService();

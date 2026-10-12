/**
 * Analytics Providers
 *
 * Defines the provider interface and built-in implementations.
 * Providers are the output targets for analytics events.
 */

export interface AnalyticsEvent {
  name: string;
  properties: Record<string, unknown>;
  timestamp: Date;
  workspaceId?: string;
  userId?: string;
}

export interface AnalyticsProvider {
  name: string;
  track(event: AnalyticsEvent): Promise<void>;
  flush?(): Promise<void>;
}

/**
 * Console provider — logs events to stdout.
 * Useful for development and debugging.
 */
export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  name = 'console';

  async track(event: AnalyticsEvent): Promise<void> {
    console.log(
      `[Analytics] ${event.name}`,
      JSON.stringify({
        workspaceId: event.workspaceId,
        userId: event.userId,
        ...event.properties,
      }),
    );
  }
}

/**
 * In-memory provider — stores events in a buffer.
 * Useful for testing and batch processing.
 */
export class InMemoryAnalyticsProvider implements AnalyticsProvider {
  name = 'in-memory';
  private buffer: AnalyticsEvent[] = [];
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  async track(event: AnalyticsEvent): Promise<void> {
    this.buffer.push(event);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.buffer];
  }

  getEventsByName(name: string): AnalyticsEvent[] {
    return this.buffer.filter((e) => e.name === name);
  }

  clear(): void {
    this.buffer = [];
  }

  async flush(): Promise<void> {
    this.buffer = [];
  }
}

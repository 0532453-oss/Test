# @service-flex/analytics

Status: **Unused** -- this package contains a working analytics service with pluggable providers but is not yet imported by any other package in the monorepo.

## What it contains

- `AnalyticsService` singleton with `addProvider()`, `track()`, and `flush()` methods
- `AnalyticsProvider` interface for building custom output targets
- Built-in providers: `ConsoleAnalyticsProvider`, `InMemoryAnalyticsProvider`
- Event factories: `createJobCompletionEvent`, `createQuoteAcceptanceEvent`, `createTechnicianLocationEvent`

## Usage

```ts
import { analyticsService, ConsoleAnalyticsProvider, createJobCompletionEvent } from '@service-flex/analytics';

analyticsService.addProvider(new ConsoleAnalyticsProvider());
analyticsService.track(createJobCompletionEvent({ ... }));
```

## TODO

- Integrate into `flexdesk-server` to track job lifecycle events
- Add a production provider (e.g., PostHog, Mixpanel, or custom HTTP endpoint)

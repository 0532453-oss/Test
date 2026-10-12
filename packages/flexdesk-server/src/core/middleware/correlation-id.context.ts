/**
 * Correlation ID Context
 *
 * Uses AsyncLocalStorage to store a per-request correlation ID
 * and request metadata that can be accessed anywhere in the request lifecycle.
 * Follows the same pattern as workspace-context.ts.
 */

import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

interface CorrelationContext {
  correlationId: string;
  userId?: string;
  method?: string;
  url?: string;
}

const correlationStorage = new AsyncLocalStorage<CorrelationContext>();

export function runWithCorrelationId<T>(correlationId: string, fn: () => T): T {
  return correlationStorage.run({ correlationId }, fn);
}

export function getCorrelationId(): string | null {
  return correlationStorage.getStore()?.correlationId ?? null;
}

export function getRequestContext(): CorrelationContext | undefined {
  return correlationStorage.getStore();
}

export function setRequestContext(updates: Partial<CorrelationContext>): void {
  const store = correlationStorage.getStore();
  if (store) {
    Object.assign(store, updates);
  }
}

export function generateCorrelationId(): string {
  return randomUUID();
}

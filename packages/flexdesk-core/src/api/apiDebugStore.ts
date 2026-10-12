/**
 * API Debug Store
 *
 * In-memory ring buffer that stores recent API call entries
 * for the debug panel. Only active in non-production environments.
 */

const MAX_ENTRIES = 50;

export interface ApiDebugEntry {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  status: number;
  durationMs: number;
  fromCache: boolean;
  error?: string;
}

type Listener = () => void;

class ApiDebugStore {
  private entries: ApiDebugEntry[] = [];
  private listeners: Set<Listener> = new Set();

  add(entry: Omit<ApiDebugEntry, 'id'>): void {
    const full: ApiDebugEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
    this.entries.unshift(full);
    if (this.entries.length > MAX_ENTRIES) {
      this.entries.pop();
    }
    this.notify();
  }

  getEntries(): ApiDebugEntry[] {
    return [...this.entries];
  }

  getErrorEntries(): ApiDebugEntry[] {
    return this.entries.filter((e) => e.status >= 400 || e.error);
  }

  clear(): void {
    this.entries = [];
    this.notify();
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      try { fn(); } catch { /* ignore */ }
    });
  }
}

export const apiDebugStore = new ApiDebugStore();

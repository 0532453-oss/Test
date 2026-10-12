/**
 * useSync hook — manages background sync state (pull + push), auto-refresh
 * every 5 min, and exposes `triggerSync()` for pull-to-refresh.
 *
 * Push sync processes the offline mutation queue after each pull sync.
 * Queue processing also triggers automatically on network reconnect.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { pullSync, pushSync, getPendingQueueCount } from '../db/sync';
import type { PushSyncResult } from '../db/sync';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export interface SyncState {
  isSyncing: boolean;
  lastSyncedAt: number | null;
  lastSyncError: string | null;
  pendingQueueCount: number;
  lastPushResult: PushSyncResult | null;
  triggerSync: () => Promise<void>;
}

export function useSync(enabled: boolean): SyncState {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [pendingQueueCount, setPendingQueueCount] = useState(0);
  const [lastPushResult, setLastPushResult] = useState<PushSyncResult | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncingRef = useRef(false);

  const refreshQueueCount = useCallback(async () => {
    try {
      const count = await getPendingQueueCount();
      setPendingQueueCount(count);
    } catch {
      // Ignore — non-critical
    }
  }, []);

  const doSync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    setLastSyncError(null);

    try {
      // Push local mutations first, then pull server data
      const pushResult = await pushSync().catch(() => null);
      if (pushResult) {
        setLastPushResult(pushResult);
      }

      await pullSync();
      setLastSyncedAt(Date.now());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      setLastSyncError(message);
    } finally {
      setIsSyncing(false);
      syncingRef.current = false;
      await refreshQueueCount();
    }
  }, [refreshQueueCount]);

  // Initial sync on mount (after auth)
  useEffect(() => {
    if (!enabled) return;
    doSync();
  }, [enabled, doSync]);

  // Background interval: sync every 5 minutes when app is foregrounded
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(() => {
      if (AppState.currentState === 'active') {
        doSync();
      }
    }, SYNC_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, doSync]);

  // Re-sync when the app comes back to foreground (also processes queued mutations)
  useEffect(() => {
    if (!enabled) return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        doSync();
      }
    });

    return () => subscription.remove();
  }, [enabled, doSync]);

  // Refresh queue count periodically (every 30s)
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(refreshQueueCount, 30_000);
    return () => clearInterval(interval);
  }, [enabled, refreshQueueCount]);

  return {
    isSyncing,
    lastSyncedAt,
    lastSyncError,
    pendingQueueCount,
    lastPushResult,
    triggerSync: doSync,
  };
}

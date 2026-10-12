/**
 * Hook to monitor sync status
 *
 * Provides real-time sync status including:
 * - Online/offline status
 * - Pending operations count
 * - Syncing operations count
 * - Failed operations count
 * - Recent sync events (for debugging)
 * - Last sync timestamp
 * - Last error message
 */

import { useEffect, useState, useCallback } from 'react';
import { syncManager, SyncEvent } from '../api/syncManager';

export interface SyncStatus {
  isOnline: boolean;
  pending: number;
  syncing: number;
  failed: number;
  total: number;
  lastSyncAt: string | null;
  lastError: string | null;
  recentEvents: SyncEvent[];
}

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: true,
    pending: 0,
    syncing: 0,
    failed: 0,
    total: 0,
    lastSyncAt: null,
    lastError: null,
    recentEvents: [],
  });

  const loadStatus = useCallback(async () => {
    const queueStatus = await syncManager.getQueueStatus();
    setStatus({
      isOnline: syncManager.isOnline(),
      ...queueStatus,
      lastSyncAt: syncManager.getLastSyncAt(),
      lastError: syncManager.getLastError(),
      recentEvents: syncManager.getEventHistory().slice(-20),
    });
  }, []);

  useEffect(() => {
    loadStatus();

    // Update status periodically
    const interval = setInterval(loadStatus, 2000);

    // Listen for online/offline events
    const unsubOnline = syncManager.addOnlineListener(() => {
      loadStatus();
    });

    // Listen for debug events to update immediately
    const unsubDebug = syncManager.addDebugListener(() => {
      loadStatus();
    });

    return () => {
      clearInterval(interval);
      unsubOnline();
      unsubDebug();
    };
  }, [loadStatus]);

  return status;
}

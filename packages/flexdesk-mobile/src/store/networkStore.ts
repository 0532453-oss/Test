/**
 * Network state store — tracks online/offline status and pending sync count.
 *
 * Uses React context + state (matching project patterns) instead of Zustand
 * to avoid an extra dependency.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { getPendingQueueCount, pushSync, pullSync } from '../db/sync';

export interface NetworkState {
  isOnline: boolean;
  pendingCount: number;
  isSyncingAfterReconnect: boolean;
}

const NetworkContext = createContext<NetworkState>({
  isOnline: true,
  pendingCount: 0,
  isSyncingAfterReconnect: false,
});

export function useNetwork(): NetworkState {
  return useContext(NetworkContext);
}

export { NetworkContext };

/**
 * Hook that manages network detection, offline-to-online sync triggers,
 * and pending queue count polling.
 */
export function useNetworkStore(): NetworkState {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncingAfterReconnect, setIsSyncingAfterReconnect] = useState(false);
  const wasOnlineRef = useRef(true);

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingQueueCount();
      setPendingCount(count);
    } catch {
      // Non-critical
    }
  }, []);

  // Subscribe to NetInfo for connectivity changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!(state.isConnected && state.isInternetReachable);
      setIsOnline(online);

      // Transition from offline to online: push then pull
      if (online && !wasOnlineRef.current) {
        setIsSyncingAfterReconnect(true);
        pushSync()
          .then(() => pullSync())
          .then(() => refreshPendingCount())
          .catch(() => {})
          .finally(() => setIsSyncingAfterReconnect(false));
      }

      wasOnlineRef.current = online;
    });

    return unsubscribe;
  }, [refreshPendingCount]);

  // Poll pending count every 30s
  useEffect(() => {
    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 30_000);
    return () => clearInterval(interval);
  }, [refreshPendingCount]);

  return { isOnline, pendingCount, isSyncingAfterReconnect };
}

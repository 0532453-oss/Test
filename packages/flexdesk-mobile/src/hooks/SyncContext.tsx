/**
 * SyncContext — provides sync state to the entire app tree.
 *
 * Wraps useSync() so any screen can read sync status, pending queue count,
 * and trigger a manual sync (e.g., for pull-to-refresh).
 */

import React, { createContext, useContext } from 'react';
import { useSync } from './useSync';
import type { SyncState } from './useSync';

const SyncContext = createContext<SyncState | null>(null);

export const SyncProvider: React.FC<{
  enabled: boolean;
  children: React.ReactNode;
}> = ({ enabled, children }) => {
  const syncState = useSync(enabled);
  return (
    <SyncContext.Provider value={syncState}>{children}</SyncContext.Provider>
  );
};

export function useSyncContext(): SyncState {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return ctx;
}

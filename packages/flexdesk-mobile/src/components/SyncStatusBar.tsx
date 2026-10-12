/**
 * SyncStatusBar — subtle bar showing sync status, pending queue count, and time-ago.
 */

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { text as textColors, background, brand, feedback } from '../theme';
import { fontSize, spacing } from '../theme';

interface SyncStatusBarProps {
  isSyncing: boolean;
  lastSyncedAt: number | null;
  lastSyncError: string | null;
  pendingQueueCount?: number;
}

function formatTimeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

export const SyncStatusBar: React.FC<SyncStatusBarProps> = ({
  isSyncing,
  lastSyncedAt,
  lastSyncError,
  pendingQueueCount = 0,
}) => {
  // Force re-render every 30s so "X min ago" stays fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(timer);
  }, []);

  const pendingBadge =
    pendingQueueCount > 0 ? (
      <Text style={styles.pendingText}>
        {pendingQueueCount} {pendingQueueCount === 1 ? 'change' : 'changes'} pending
      </Text>
    ) : null;

  if (isSyncing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={brand.olive} />
        <Text style={styles.text}>Syncing...</Text>
        {pendingBadge}
      </View>
    );
  }

  if (lastSyncError) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Sync failed</Text>
        {pendingBadge}
      </View>
    );
  }

  if (lastSyncedAt) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          Last synced: {formatTimeAgo(lastSyncedAt)}
        </Text>
        {pendingBadge}
      </View>
    );
  }

  // Even if no sync yet, show pending count
  if (pendingQueueCount > 0) {
    return (
      <View style={styles.container}>
        {pendingBadge}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    backgroundColor: background.input,
    gap: spacing.xs,
  },
  errorContainer: {
    backgroundColor: feedback.errorBg,
  },
  text: {
    fontSize: fontSize.xs,
    color: textColors.secondary,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: feedback.error,
  },
  pendingText: {
    fontSize: fontSize.xs,
    color: feedback.offlineText,
    fontWeight: '500',
  },
});

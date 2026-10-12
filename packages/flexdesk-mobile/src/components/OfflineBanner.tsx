/**
 * OfflineBanner — shows a yellow banner when the device is offline
 * or when syncing pending changes after reconnection.
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { feedback, text as textColors } from '../theme';
import { fontSize, spacing } from '../theme';
import { useNetwork } from '../store/networkStore';

export const OfflineBanner: React.FC = () => {
  const { isOnline, pendingCount, isSyncingAfterReconnect } = useNetwork();

  if (isSyncingAfterReconnect) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={feedback.offlineText} />
        <Text style={styles.text}>
          Syncing {pendingCount} {pendingCount === 1 ? 'change' : 'changes'}...
        </Text>
      </View>
    );
  }

  if (!isOnline) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>You are offline</Text>
        {pendingCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingCount}</Text>
          </View>
        )}
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
    paddingHorizontal: spacing.md,
    backgroundColor: feedback.offlineBanner,
    gap: spacing.xs,
  },
  text: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: feedback.offlineText,
  },
  badge: {
    backgroundColor: feedback.offlineText,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

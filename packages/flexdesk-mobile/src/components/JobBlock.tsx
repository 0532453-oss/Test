import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { background, jobStatus as jobStatusColors, text as textColors } from '../theme';
import {
  fontSize,
  fontWeight,
  pressFeedback,
  radius,
  shadows,
  size,
  spacing,
  typography,
} from '../theme';
import type { JobStatus } from '../api/types';

interface JobBlockProps {
  title: string;
  clientName: string;
  address: string | null;
  startTime: string | null;
  endTime: string | null;
  status: JobStatus;
  onPress: () => void;
}

function formatTime(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

function getStatusBarColor(status: JobStatus): string {
  switch (status) {
    case 'SCHEDULED':
    case 'DISPATCHED':
      return jobStatusColors.scheduled;
    case 'IN_PROGRESS':
      return jobStatusColors.inProgress;
    case 'COMPLETED':
      return jobStatusColors.completed;
    case 'CANCELLED':
    case 'ON_HOLD':
      return jobStatusColors.cancelled;
  }
}

export const JobBlock: React.FC<JobBlockProps> = ({
  title,
  clientName,
  address,
  startTime,
  endTime,
  status,
  onPress,
}) => {
  const barColor = getStatusBarColor(status);
  const timeRange =
    startTime && endTime
      ? `${formatTime(startTime)} - ${formatTime(endTime)}`
      : 'Unscheduled';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${clientName}, ${timeRange}`}
    >
      <View style={[styles.statusBar, { backgroundColor: barColor }]} />
      <View style={styles.content}>
        <Text style={styles.time}>{timeRange}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.client}>{clientName}</Text>
        {address && (
          <Text style={styles.address} numberOfLines={1}>
            {address}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: background.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.cardSubtle,
  },
  pressed: {
    transform: [{ scale: pressFeedback.scale }],
    opacity: pressFeedback.opacity,
  },
  statusBar: {
    width: size.jobStatusBarWidth,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  content: {
    flex: 1,
    padding: 14,
    gap: spacing.xs,
  },
  time: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    color: textColors.primary,
  },
  title: {
    ...typography.cardTitleSm,
    fontWeight: fontWeight.medium,
    color: textColors.primary,
  },
  client: {
    ...typography.captionMd,
    color: textColors.secondary,
  },
  address: {
    ...typography.caption,
    color: textColors.muted,
  },
});

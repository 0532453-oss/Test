import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { background, text as textColors } from '../theme';
import {
  fontSize,
  pressFeedback,
  radius,
  shadows,
  size,
  spacing,
  typography,
} from '../theme';

interface StatBubbleProps {
  icon: string;
  iconBg: string;
  value?: string;
  label: string;
  onPress?: () => void;
}

export const StatBubble: React.FC<StatBubbleProps> = ({
  icon,
  iconBg,
  value,
  label,
  onPress,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value ?? '0'}`}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <Text style={styles.value}>{value ?? '0'}</Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: background.card,
    borderRadius: radius.lg,
    padding: 14,
    ...shadows.card,
  },
  pressed: {
    transform: [{ scale: pressFeedback.scale }],
    opacity: pressFeedback.opacity,
  },
  iconCircle: {
    width: size.metricIconCircle,
    height: size.metricIconCircle,
    borderRadius: size.metricIconCircle / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  iconText: {
    fontSize: fontSize.body,
  },
  value: {
    ...typography.metricMedium,
    color: textColors.primary,
  },
  label: {
    ...typography.caption,
    color: textColors.secondary,
    marginTop: spacing.xxs,
  },
});

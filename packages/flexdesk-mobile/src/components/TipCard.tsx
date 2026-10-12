import React, { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { background, text as textColors } from '../theme';
import { fontSize, fontWeight, radius, size, spacing, typography } from '../theme';

interface TipCardProps {
  icon: string;
  message: string;
  ctaText: string;
  onCtaPress: () => void;
  onDismiss?: () => void;
}

export const TipCard: React.FC<TipCardProps> = ({
  icon,
  message,
  ctaText,
  onCtaPress,
  onDismiss,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;

  if (dismissed) {
    return null;
  }

  const handleDismiss = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setDismissed(true);
      onDismiss?.();
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.topRow}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        <Pressable
          onPress={handleDismiss}
          style={styles.closeButton}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Dismiss tip"
        >
          <Text style={styles.closeText}>X</Text>
        </Pressable>
      </View>
      <Pressable onPress={onCtaPress} style={styles.ctaRow}>
        <Text style={styles.ctaText}>{ctaText}</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: background.tipCard,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: size.iconXl,
    marginRight: spacing.md,
  },
  message: {
    ...typography.bodyMedium,
    color: textColors.onTip,
    flex: 1,
  },
  closeButton: {
    width: size.minTapTarget,
    height: size.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  closeText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: textColors.secondary,
  },
  ctaRow: {
    marginTop: spacing.sm,
    minHeight: size.minTapTarget,
    justifyContent: 'center',
  },
  ctaText: {
    ...typography.bodyMedium,
    color: textColors.link,
  },
});

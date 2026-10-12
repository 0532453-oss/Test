import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { brand, border, text as textColors } from '../theme';
import { fontSize, fontWeight, size, spacing, typography } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MetricCircleProps {
  value: number;
  maxValue: number;
  label: string;
}

export const MetricCircle: React.FC<MetricCircleProps> = ({
  value,
  maxValue,
  label,
}) => {
  const diameter = size.healthRingDiameter;
  const strokeWidth = size.healthRingStroke;
  const radiusVal = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusVal;
  const progress = maxValue > 0 ? Math.min(value / maxValue, 1) : 0;
  const targetOffset = circumference * (1 - progress);
  const center = diameter / 2;

  const animatedOffset = useRef(new Animated.Value(circumference)).current;

  useEffect(() => {
    if (progress === 0) {
      animatedOffset.setValue(circumference);
      return;
    }

    animatedOffset.setValue(circumference);
    const timer = setTimeout(() => {
      Animated.timing(animatedOffset, {
        toValue: targetOffset,
        duration: 600,
        useNativeDriver: false,
      }).start();
    }, 200);

    return () => clearTimeout(timer);
  }, [progress, circumference, targetOffset, animatedOffset]);

  return (
    <View
      style={styles.wrapper}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value} of ${maxValue}`}
    >
      <View style={[styles.container, { width: diameter, height: diameter }]}>
        <Svg width={diameter} height={diameter}>
          {/* Background circle */}
          <Circle
            cx={center}
            cy={center}
            r={radiusVal}
            stroke={border.light}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress arc */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radiusVal}
            stroke={brand.olive}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={animatedOffset}
            strokeLinecap="round"
            rotation={-90}
            origin={`${center}, ${center}`}
          />
        </Svg>
        {/* Center content */}
        <View style={styles.centerContent}>
          <Text style={styles.valueText}>{value}</Text>
          <View style={styles.divider} />
          <Text style={styles.targetText}>of {maxValue}</Text>
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    ...typography.metricLarge,
    color: textColors.primary,
  },
  divider: {
    width: size.healthRingDivider,
    height: 1,
    backgroundColor: border.divider,
    marginVertical: spacing.xs,
  },
  targetText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    color: textColors.secondary,
  },
  label: {
    ...typography.captionMd,
    color: textColors.secondary,
    marginTop: spacing.sm,
  },
});

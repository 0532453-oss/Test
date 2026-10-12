import React from 'react';
import { Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { brand, text as textColors } from '../theme';
import { pressFeedback, shadows, size } from '../theme';

interface FABProps {
  onPress: () => void;
}

export const FAB: React.FC<FABProps> = ({ onPress }) => {
  const handlePress = () => {
    try {
      Vibration.vibrate(10);
    } catch {}
    onPress();
  };

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Create new item"
      >
        <Text style={styles.icon}>+</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: size.tabBarTotalHeight + size.fabBottomOffset,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  button: {
    width: size.fabSize,
    height: size.fabSize,
    borderRadius: size.fabSize / 2,
    backgroundColor: brand.oliveDark,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.fab,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  icon: {
    fontSize: size.fabIconSize,
    color: textColors.onPrimary,
    fontWeight: '300',
    lineHeight: size.fabIconSize + 2,
  },
});

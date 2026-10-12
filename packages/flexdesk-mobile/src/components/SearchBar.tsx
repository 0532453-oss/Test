import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { background, border, text as textColors } from '../theme';
import { fontSize, fontWeight, radius, size, spacing } from '../theme';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  value,
  onChangeText,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        isFocused && styles.focused,
      ]}
    >
      <Text style={styles.searchIcon}>&#x1F50D;</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={textColors.muted}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        returnKeyType="search"
        autoCorrect={false}
        spellCheck={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        enablesReturnKeyAutomatically={true}
        accessibilityLabel={placeholder}
        accessibilityRole="search"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: background.input,
    borderRadius: radius.md,
    height: size.minTapTarget,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchIcon: {
    fontSize: size.iconMd,
    marginRight: spacing.sm,
    color: textColors.muted,
  },
  focused: {
    borderColor: border.inputFocus,
  },
  input: {
    flex: 1,
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    color: textColors.primary,
    paddingVertical: 0,
  },
});

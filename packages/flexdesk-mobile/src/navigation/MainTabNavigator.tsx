import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { background, border, brand, text as textColors } from '../theme';
import { fontSize, fontWeight, size, spacing } from '../theme';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ClientListScreen } from '../screens/ClientListScreen';
import { JobCalendarScreen } from '../screens/JobCalendarScreen';
import { InvoicingScreen } from '../screens/InvoicingScreen';

const Tab = createBottomTabNavigator();

// Simple text-based icons matching the design spec
const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Home: { active: '\u2302', inactive: '\u2302' },
  Clients: { active: '\u263A', inactive: '\u263A' },
  Calendar: { active: '\uD83D\uDCC5', inactive: '\uD83D\uDCC5' },
  Invoices: { active: '\uD83D\uDCC4', inactive: '\uD83D\uDCC4' },
};

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBar,
        { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.sm },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const icons = TAB_ICONS[route.name] ?? { active: '?', inactive: '?' };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={route.name}
          >
            <Text
              style={[
                styles.tabIcon,
                { color: isFocused ? brand.olive : textColors.secondary },
              ]}
            >
              {isFocused ? icons.active : icons.inactive}
            </Text>
            {isFocused && (
              <Text style={styles.tabLabel}>{route.name}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Clients" component={ClientListScreen} />
      <Tab.Screen name="Calendar" component={JobCalendarScreen} />
      <Tab.Screen name="Invoices" component={InvoicingScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: background.card,
    borderTopWidth: size.tabBarBorderWidth,
    borderTopColor: border.light,
    paddingTop: spacing.sm,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: size.minTapTarget,
  },
  tabIcon: {
    fontSize: size.iconLg,
  },
  tabLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: brand.olive,
    marginTop: spacing.xxs,
  },
});

import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import DatabaseProvider from '@nozbe/watermelondb/DatabaseProvider';
import { database } from './src/db';
import { MainTabNavigator } from './src/navigation/MainTabNavigator';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { JobDetailScreen } from './src/screens/JobDetailScreen';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import {
  handleDeepLink,
  getInitialDeepLink,
  setDeepLinkLoginHandler,
} from './src/auth/deepLinking';
import { SyncProvider, useSyncContext } from './src/hooks';
import { SyncStatusBar, OfflineBanner } from './src/components';
import { NetworkContext, useNetworkStore } from './src/store/networkStore';
import { background, brand, text as textColors, typography, spacing } from './src/theme';

// ── React Query setup ────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true,
    },
  },
});

// Refetch queries when the app comes back to the foreground (React Native).
function onAppStateChange(status: string) {
  focusManager.setFocused(status === 'active');
}


/**
 * Deep link configuration for React Navigation.
 */
const linking = {
  prefixes: ['flexdesk://'],
  config: {
    screens: {},
  },
};

// ── Navigation stacks ────────────────────────────────────────────────────────

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  JobDetail: { jobId: string };
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainNavigatorContent() {
  const sync = useSyncContext();
  return (
    <View style={styles.root}>
      <OfflineBanner />
      <SyncStatusBar
        isSyncing={sync.isSyncing}
        lastSyncedAt={sync.lastSyncedAt}
        lastSyncError={sync.lastSyncError}
        pendingQueueCount={sync.pendingQueueCount}
      />
      <MainStack.Navigator screenOptions={{ headerShown: false }}>
        <MainStack.Screen name="Tabs" component={MainTabNavigator} />
        <MainStack.Screen name="JobDetail" component={JobDetailScreen} />
      </MainStack.Navigator>
    </View>
  );
}

function MainNavigator() {
  return (
    <SyncProvider enabled>
      <MainNavigatorContent />
    </SyncProvider>
  );
}

// ── Splash / loading screen ──────────────────────────────────────────────────

function SplashScreen() {
  return (
    <View style={styles.splash}>
      <View style={styles.splashLogo}>
        <Text style={styles.splashLogoText}>FD</Text>
      </View>
      <Text style={styles.splashTitle}>FlexDesk</Text>
      <ActivityIndicator
        size="large"
        color={brand.olive}
        style={styles.splashSpinner}
      />
    </View>
  );
}

// ── Root navigator — decides auth vs main ────────────────────────────────────

function RootNavigator() {
  const { isLoading, isAuthenticated, login } = useAuth();

  useEffect(() => {
    // Wire deep link OAuth flow into the auth context
    setDeepLinkLoginHandler(login);

    // Handle deep link that launched the app (cold start)
    getInitialDeepLink().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Handle deep links while the app is already open (warm start)
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [login]);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer linking={linking}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

// ── App entry ────────────────────────────────────────────────────────────────

function NetworkProvider({ children }: { children: React.ReactNode }) {
  const networkState = useNetworkStore();
  return (
    <NetworkContext.Provider value={networkState}>
      {children}
    </NetworkContext.Provider>
  );
}

const App: React.FC = () => {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <DatabaseProvider database={database}>
        <QueryClientProvider client={queryClient}>
          <NetworkProvider>
            <SafeAreaProvider>
              <StatusBar barStyle="dark-content" backgroundColor={background.screen} />
              <AuthProvider>
                <RootNavigator />
              </AuthProvider>
            </SafeAreaProvider>
          </NetworkProvider>
        </QueryClientProvider>
      </DatabaseProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  splash: {
    flex: 1,
    backgroundColor: background.screen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: brand.oliveDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  splashLogoText: {
    color: textColors.onPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  splashTitle: {
    ...typography.screenTitle,
    color: textColors.primary,
    marginBottom: spacing.xxl,
  },
  splashSpinner: {
    marginTop: spacing.md,
  },
});

export default App;

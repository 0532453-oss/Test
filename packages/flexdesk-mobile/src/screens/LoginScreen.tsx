import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Config from 'react-native-config';
import apiClient from '../api/client';
import { useAuth } from '../auth/useAuth';
import {
  background,
  border,
  brand,
  feedback,
  text as textColors,
  typography,
  spacing,
  radius,
  fontSize,
  fontWeight,
  size,
} from '../theme';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type LoginNavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<LoginNavProp>();
  const auth = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data } = await apiClient.post<{
        access_token: string;
        refresh_token: string;
      }>('/auth/login', { email: email.trim(), password });

      await auth.login(data.access_token, data.refresh_token);
      // AuthProvider updates isAuthenticated → App.tsx switches to MainTabNavigator
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setError('Invalid email or password.');
      } else if (status === 429) {
        setError('Too many attempts. Account locked for 15 minutes.');
      } else {
        setError('Unable to connect. Please check your network and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const baseURL = Config.API_URL ?? 'http://localhost:3001/api/v1';
      const googleAuthUrl = `${baseURL}/auth/google`;
      const canOpen = await Linking.canOpenURL(googleAuthUrl);

      if (!canOpen) {
        setError('Unable to open browser for Google sign-in.');
        setGoogleLoading(false);
        return;
      }

      await Linking.openURL(googleAuthUrl);
      // Deep link callback is handled in App.tsx via Linking.addEventListener.
      // When the callback arrives, App.tsx exchanges the code for tokens.
      // Navigation to main app is handled by auth guard (US-006).
      // Reset loading after a timeout in case the user cancels the browser flow.
      setTimeout(() => setGoogleLoading(false), 30_000);
    } catch {
      setError('Unable to open browser for Google sign-in.');
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.xxxxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / Brand */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>FD</Text>
          </View>
          <Text style={styles.appName}>FlexDesk</Text>
          <Text style={styles.tagline}>Field service, simplified.</Text>
        </View>

        {/* Error message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Email input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@company.com"
            placeholderTextColor={textColors.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            editable={!loading}
            returnKeyType="next"
          />
        </View>

        {/* Password input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Enter your password"
              placeholderTextColor={textColors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              editable={!loading}
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />
            <Pressable
              style={styles.toggleBtn}
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={8}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <Text style={styles.toggleText}>
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Login button */}
        <Pressable
          style={[styles.loginBtn, (loading || googleLoading) && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading || googleLoading}
          accessibilityRole="button"
          accessibilityLabel="Log in"
        >
          {loading ? (
            <ActivityIndicator color={textColors.onPrimary} />
          ) : (
            <Text style={styles.loginBtnText}>Log In</Text>
          )}
        </Pressable>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google OAuth button */}
        <Pressable
          style={[styles.googleBtn, (loading || googleLoading) && styles.googleBtnDisabled]}
          onPress={handleGoogleSignIn}
          disabled={loading || googleLoading}
          accessibilityRole="button"
          accessibilityLabel="Sign in with Google"
        >
          {googleLoading ? (
            <ActivityIndicator color={textColors.primary} />
          ) : (
            <Text style={styles.googleBtnText}>Sign in with Google</Text>
          )}
        </Pressable>

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerPrompt}>Don't have an account? </Text>
          <Pressable onPress={() => navigation.navigate('Register')} hitSlop={8}>
            <Text style={styles.registerLink}>Sign Up</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: background.screen,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxxl,
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: brand.oliveDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    color: textColors.onPrimary,
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
  },
  appName: {
    ...typography.screenTitle,
    color: textColors.primary,
    marginBottom: spacing.xs,
  },
  tagline: {
    ...typography.body,
    color: textColors.secondary,
  },

  // Error
  errorContainer: {
    backgroundColor: feedback.errorBg,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: feedback.error,
  },

  // Inputs
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodyMedium,
    color: textColors.primary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: background.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: textColors.primary,
    minHeight: size.minTapTarget,
  },
  passwordRow: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 64,
  },
  toggleBtn: {
    position: 'absolute',
    right: spacing.lg,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  toggleText: {
    color: brand.olive,
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
  },

  // Login button
  loginBtn: {
    backgroundColor: brand.olive,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: size.minTapTarget,
    marginTop: spacing.sm,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: textColors.onPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: border.light,
  },
  dividerText: {
    ...typography.body,
    color: textColors.secondary,
    marginHorizontal: spacing.md,
  },

  // Google button
  googleBtn: {
    backgroundColor: background.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: border.light,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: size.minTapTarget,
  },
  googleBtnDisabled: {
    opacity: 0.7,
  },
  googleBtnText: {
    color: textColors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },

  // Register row
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxl,
  },
  registerPrompt: {
    ...typography.body,
    color: textColors.secondary,
  },
  registerLink: {
    ...typography.bodyMedium,
    color: brand.olive,
  },
});

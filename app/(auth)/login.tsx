import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AccessibilityInfo, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useScreenAnnouncement } from '../../hooks/useScreenAnnouncement';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { LogoHeader } from '../../components/common/LogoHeader';
import { TextInput } from '../../components/common/TextInput';
import { PasswordInput } from '../../components/common/PasswordInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { isDemoModeEnabled } from '../../constants/demo';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithDemo } = useAuth();

  useScreenAnnouncement('Login screen. Enter your credentials to access UniFit.');

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const isDemoMode = isDemoModeEnabled();

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    const trimmedInput = emailOrUsername.trim();

    if (!trimmedInput) {
      errors.email = 'Please enter your email or username.';
    } else if (trimmedInput.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedInput)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Please enter your password.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    setFieldErrors(errors);
    const firstErr = errors.email || errors.password;
    if (firstErr) {
      AccessibilityInfo.announceForAccessibility(firstErr);
    }
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    setErrorMessage(null);
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await signIn(emailOrUsername, password);
      if (result.success) {
        if (result.requiresQuiz) {
          router.replace('/quiz');
        } else {
          router.replace('/(app)');
        }
      } else {
        const err = result.error || 'Invalid credentials. Please check and try again.';
        setErrorMessage(err);
        AccessibilityInfo.announceForAccessibility(err);
      }
    } catch (err) {
      const netErr = 'Unable to log in. Please check your connection and try again.';
      setErrorMessage(netErr);
      AccessibilityInfo.announceForAccessibility(netErr);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    if (isLoading || isDemoLoading) return;
    setErrorMessage(null);
    setIsDemoLoading(true);
    try {
      const result = await signInWithDemo();
      if (result.success) {
        router.replace('/(app)');
      } else {
        const err = result.error || 'Demo login failed. Please try again.';
        setErrorMessage(err);
        AccessibilityInfo.announceForAccessibility(err);
      }
    } catch {
      const netErr = 'Unable to connect to demo account service.';
      setErrorMessage(netErr);
      AccessibilityInfo.announceForAccessibility(netErr);
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* Brand Header */}
      <LogoHeader
        size="md"
        showTaglines={true}
        theme="light"
        title="Welcome Back!"
        subtitle="Login to continue your fitness journey."
      />

      {/* General Error Banner */}
      {errorMessage ? (
        <View
          style={styles.errorBanner}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          <Feather name="alert-circle" size={18} color={Colors.error} style={styles.errorIcon} accessible={false} />
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Login Form */}
      <View style={styles.formContainer}>
        <TextInput
          label="Email or Username"
          placeholder="Enter your email or username"
          value={emailOrUsername}
          onChangeText={(text) => {
            setEmailOrUsername(text);
            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
            if (errorMessage) setErrorMessage(null);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          leftIcon={<Feather name="mail" size={18} color={Colors.textMuted} accessible={false} />}
          error={fieldErrors.email}
          accessibilityLabel="Email or username"
          accessibilityHint="Enter your email or username"
        />

        <PasswordInput
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
            if (errorMessage) setErrorMessage(null);
          }}
          autoComplete="password"
          error={fieldErrors.password}
          accessibilityLabel="Password"
          accessibilityHint="Enter your account password"
        />

        <View style={styles.forgotContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(auth)/forgot-password')}
            accessible={true}
            accessibilityRole="link"
            accessibilityLabel="Forgot password"
            accessibilityHint="Navigates to the password recovery screen"
            style={styles.forgotButton}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <PrimaryButton
          title="Login"
          onPress={handleLogin}
          isLoading={isLoading}
          disabled={isLoading || isDemoLoading}
          accessibilityLabel="Login"
          accessibilityHint="Submits credentials and logs in"
          style={styles.loginButton}
        />

        {/* Demo Account Quick Access (Presentation / Testing Mode) */}
        {isDemoMode && (
          <TouchableOpacity
            style={[styles.demoButton, (isLoading || isDemoLoading) && styles.demoButtonDisabled]}
            onPress={handleDemoLogin}
            disabled={isLoading || isDemoLoading}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isDemoLoading ? "Signing in to demo account" : "Continue with Demo Account"}
            accessibilityHint="Authenticates using the predefined presentation demo account"
          >
            {isDemoLoading ? (
              <View style={styles.demoLoadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} style={styles.demoSpinner} />
                <Text style={styles.demoButtonText}>Signing in...</Text>
              </View>
            ) : (
              <View style={styles.demoContentContainer}>
                <Feather name="zap" size={16} color={Colors.primary} style={styles.demoIcon} accessible={false} />
                <Text style={styles.demoButtonText}>Continue with Demo Account</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom Sign Up Link */}
      <View style={styles.footerSection}>
        <Text style={styles.footerText}>Don't have an account?</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/(auth)/signup')}
          accessible={true}
          accessibilityRole="link"
          accessibilityLabel="Sign up"
          accessibilityHint="Navigates to the account creation screen"
          style={styles.signUpLink}
        >
          <Text style={styles.signUpLinkText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
    marginTop: Layout.spacing.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorBackground,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  errorIcon: {
    marginRight: Layout.spacing.sm,
  },
  errorBannerText: {
    ...Typography.bodySmall,
    color: Colors.error,
    flex: 1,
    fontWeight: '500',
  },
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: Layout.spacing.lg,
    marginTop: -Layout.spacing.xs,
  },
  forgotButton: {
    paddingVertical: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  forgotText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: Layout.spacing.sm,
  },
  demoButton: {
    backgroundColor: '#F0F7FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: Layout.borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: Layout.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.lg,
    minHeight: 48,
  },
  demoButtonDisabled: {
    opacity: 0.6,
  },
  demoLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoIcon: {
    marginRight: Layout.spacing.xs,
  },
  demoSpinner: {
    marginRight: Layout.spacing.xs,
  },
  demoButtonText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '700',
  },
  footerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Layout.spacing.md,
    paddingBottom: Layout.spacing.lg,
  },
  footerText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginRight: Layout.spacing.xs,
  },
  signUpLink: {
    paddingVertical: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  signUpLinkText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '700',
  },
});

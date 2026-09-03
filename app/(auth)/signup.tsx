import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AccessibilityInfo } from 'react-native';
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

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  useScreenAnnouncement('Create Account screen. Fill in your details to register.');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      errors.fullName = 'Please enter your full name.';
    } else if (trimmedName.length < 2) {
      errors.fullName = 'Full name must be at least 2 characters.';
    }

    if (!trimmedEmail) {
      errors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Please create a password.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    const firstErr = errors.fullName || errors.email || errors.password || errors.confirmPassword;
    if (firstErr) {
      AccessibilityInfo.announceForAccessibility(firstErr);
    }
    return Object.keys(errors).length === 0;
  };

  const handleSignUp = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await signUp(fullName, email, password);
      if (result.success) {
        if (result.confirmationSent) {
          const msg = 'Account created! Please check your email to confirm your account, then log in.';
          setSuccessMessage(msg);
          AccessibilityInfo.announceForAccessibility(msg);
        } else if (result.requiresQuiz) {
          router.replace('/quiz');
        } else {
          router.replace('/(app)');
        }
      } else {
        const err = result.error || 'Failed to create account. Please try again.';
        setErrorMessage(err);
        AccessibilityInfo.announceForAccessibility(err);
      }
    } catch (err) {
      const netErr = 'Unable to register. Please check your connection and try again.';
      setErrorMessage(netErr);
      AccessibilityInfo.announceForAccessibility(netErr);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* Brand Header */}
      <LogoHeader
        size="sm"
        showTaglines={false}
        theme="light"
        title="Create Your Account"
        subtitle="Join UniFit to start your personalized, barrier-free fitness journey."
      />

      {/* Success Notification */}
      {successMessage ? (
        <View
          style={styles.successBanner}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <Feather name="check-circle" size={18} color={Colors.success} style={styles.bannerIcon} accessible={false} />
          <Text style={styles.successBannerText}>{successMessage}</Text>
        </View>
      ) : null}

      {/* Error Notification */}
      {errorMessage ? (
        <View
          style={styles.errorBanner}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          <Feather name="alert-circle" size={18} color={Colors.error} style={styles.bannerIcon} accessible={false} />
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Form Fields */}
      <View style={styles.formContainer}>
        <TextInput
          label="Full Name"
          placeholder="e.g. Alex Morgan"
          value={fullName}
          onChangeText={(text) => {
            setFullName(text);
            if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
            if (errorMessage) setErrorMessage(null);
          }}
          autoCapitalize="words"
          autoCorrect={false}
          autoComplete="name"
          leftIcon={<Feather name="user" size={18} color={Colors.textMuted} accessible={false} />}
          error={fieldErrors.fullName}
          accessibilityLabel="Full Name"
          accessibilityHint="Enter your first and last name"
        />

        <TextInput
          label="Email"
          placeholder="e.g. alex@example.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
            if (errorMessage) setErrorMessage(null);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          leftIcon={<Feather name="mail" size={18} color={Colors.textMuted} accessible={false} />}
          error={fieldErrors.email}
          accessibilityLabel="Email"
          accessibilityHint="Enter your valid email address"
        />

        <PasswordInput
          label="Password"
          placeholder="At least 6 characters"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
            if (errorMessage) setErrorMessage(null);
          }}
          autoComplete="new-password"
          error={fieldErrors.password}
          accessibilityLabel="Password"
          accessibilityHint="Create a secure password with at least 6 characters"
        />

        <PasswordInput
          label="Confirm Password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            if (errorMessage) setErrorMessage(null);
          }}
          autoComplete="new-password"
          error={fieldErrors.confirmPassword}
          accessibilityLabel="Confirm Password"
          accessibilityHint="Re-enter the exact same password for confirmation"
        />

        <PrimaryButton
          title="Create Account"
          onPress={handleSignUp}
          isLoading={isLoading}
          accessibilityLabel="Create Account"
          accessibilityHint="Submits registration form and navigates to the assessment"
          style={styles.submitButton}
        />
      </View>

      {/* Login Navigation Link */}
      <View style={styles.footerSection}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/(auth)/login')}
          accessible={true}
          accessibilityRole="link"
          accessibilityLabel="Log into your existing account"
          accessibilityHint="Navigates back to the login screen"
          style={styles.loginLink}
        >
          <Text style={styles.loginLinkText}>Login</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
    marginTop: Layout.spacing.xs,
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successBackground,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  bannerIcon: {
    marginRight: Layout.spacing.sm,
  },
  errorBannerText: {
    ...Typography.bodySmall,
    color: Colors.error,
    flex: 1,
    fontWeight: '500',
  },
  successBannerText: {
    ...Typography.bodySmall,
    color: Colors.success,
    flex: 1,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: Layout.spacing.sm,
    marginBottom: Layout.spacing.md,
  },
  footerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Layout.spacing.sm,
    paddingBottom: Layout.spacing.lg,
  },
  footerText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginRight: Layout.spacing.xs,
  },
  loginLink: {
    paddingVertical: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  loginLinkText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '700',
  },
});

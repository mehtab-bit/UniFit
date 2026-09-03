import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AccessibilityInfo } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useScreenAnnouncement } from '../../hooks/useScreenAnnouncement';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { LogoHeader } from '../../components/common/LogoHeader';
import { TextInput } from '../../components/common/TextInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();

  useScreenAnnouncement('Forgot Password screen. Enter your email to reset your password.');

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);

  const validateForm = (): boolean => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      const err = 'Please enter your email address.';
      setEmailError(err);
      AccessibilityInfo.announceForAccessibility(err);
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      const err = 'Please enter a valid email address.';
      setEmailError(err);
      AccessibilityInfo.announceForAccessibility(err);
      return false;
    }
    setEmailError(undefined);
    return true;
  };

  const handleResetPassword = async () => {
    setErrorMessage(null);
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await resetPassword(email);
      if (result.success) {
        setIsSuccess(true);
        AccessibilityInfo.announceForAccessibility('Reset link dispatched. Please check your inbox.');
      } else {
        const err = result.error || 'Unable to send reset instructions. Please try again.';
        setErrorMessage(err);
        AccessibilityInfo.announceForAccessibility(err);
      }
    } catch (err) {
      const netErr = 'Unable to connect. Please check your network and try again.';
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
        size="md"
        showTaglines={false}
        theme="light"
        title="Forgot Password?"
        subtitle="Enter your email address and we'll send you a password reset link."
      />

      {/* Success Notification */}
      {isSuccess ? (
        <View
          style={styles.successCard}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <View style={styles.successIconCircle} accessible={false} importantForAccessibility="no">
            <Feather name="check" size={24} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Reset Link Dispatched</Text>
          <Text style={styles.successBody}>
            We have sent password reset instructions to{' '}
            <Text style={styles.emailHighlight}>{email.trim()}</Text>. Please check your inbox and follow the provided link.
          </Text>

          <PrimaryButton
            title="Back to Login"
            onPress={() => router.replace('/(auth)/login')}
            accessibilityLabel="Back to Login"
            accessibilityHint="Returns to login screen"
            style={styles.backButton}
          />
        </View>
      ) : (
        <View style={styles.formContainer}>
          {/* Error Banner */}
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

          <TextInput
            label="Email"
            placeholder="Enter your registered email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError(undefined);
              if (errorMessage) setErrorMessage(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            leftIcon={<Feather name="mail" size={18} color={Colors.textMuted} accessible={false} />}
            error={emailError}
            accessibilityLabel="Email"
            accessibilityHint="Input the email address associated with your account"
          />

          <PrimaryButton
            title="Send Reset Link"
            onPress={handleResetPassword}
            isLoading={isLoading}
            accessibilityLabel="Send Reset Link"
            accessibilityHint="Dispatches password recovery email"
            style={styles.submitBtn}
          />

          <View style={styles.footerSection}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              accessible={true}
              accessibilityRole="link"
              accessibilityLabel="Back to Login"
              accessibilityHint="Navigates back to the login screen"
              style={styles.backLink}
            >
              <Feather name="arrow-left" size={16} color={Colors.primary} style={styles.backIcon} accessible={false} />
              <Text style={styles.backLinkText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  bannerIcon: {
    marginRight: Layout.spacing.sm,
  },
  errorBannerText: {
    ...Typography.bodySmall,
    color: Colors.error,
    flex: 1,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: Layout.spacing.sm,
    marginBottom: Layout.spacing.lg,
  },
  footerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Layout.spacing.lg,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.xs,
    paddingHorizontal: Layout.spacing.sm,
    minHeight: 44,
  },
  backIcon: {
    marginRight: Layout.spacing.xs,
  },
  backLinkText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '700',
  },
  successCard: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.xl,
    alignItems: 'center',
    marginTop: Layout.spacing.md,
    ...Layout.shadows.card,
  },
  successIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.successBackground,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.md,
  },
  successTitle: {
    ...Typography.h2,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  successBody: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Layout.spacing.xl,
  },
  emailHighlight: {
    color: Colors.text,
    fontWeight: '600',
  },
  backButton: {
    width: '100%',
  },
});

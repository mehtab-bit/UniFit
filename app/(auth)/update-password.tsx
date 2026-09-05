import React, { useState } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useScreenAnnouncement } from '../../hooks/useScreenAnnouncement';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { LogoHeader } from '../../components/common/LogoHeader';
import { PasswordInput } from '../../components/common/PasswordInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

export default function UpdatePasswordScreen() {
  const router = useRouter();
  const { updatePassword } = useAuth();

  useScreenAnnouncement(
    'Update password screen. Choose a new password for your account.'
  );

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const [confirmError, setConfirmError] = useState<string | undefined>(undefined);

  const validate = (): boolean => {
    let valid = true;
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      valid = false;
    } else {
      setPasswordError(undefined);
    }
    if (confirmPassword !== password) {
      setConfirmError('Passwords do not match.');
      valid = false;
    } else {
      setConfirmError(undefined);
    }
    if (!valid) {
      AccessibilityInfo.announceForAccessibility(
        passwordError || confirmError || 'Please correct the password fields.'
      );
    }
    return valid;
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    if (!validate()) return;
    setIsLoading(true);
    try {
      const result = await updatePassword(password);
      if (result.success) {
        setIsSuccess(true);
        AccessibilityInfo.announceForAccessibility(
          'Your password has been updated. You can now sign in.'
        );
      } else {
        const err = result.error || 'Unable to update your password. Please try again.';
        setErrorMessage(err);
        AccessibilityInfo.announceForAccessibility(err);
      }
    } catch {
      const err = 'Unable to connect. Please check your network and try again.';
      setErrorMessage(err);
      AccessibilityInfo.announceForAccessibility(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout>
        <LogoHeader
          size="md"
          showTaglines={false}
          theme="light"
          title="Password Updated"
          subtitle="Your password has been changed successfully."
        />
        <View
          style={styles.successCard}
          accessible
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <View style={styles.successIconCircle} accessible={false}>
            <Feather name="check" size={24} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>All set</Text>
          <Text style={styles.successBody}>
            Use your new password the next time you sign in to UniFit.
          </Text>
          <PrimaryButton
            title="Go to Login"
            onPress={() => router.replace('/(auth)/login')}
            style={styles.fullWidth}
          />
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <LogoHeader
        size="md"
        showTaglines={false}
        theme="light"
        title="Create a New Password"
        subtitle="Enter a new password for your UniFit account."
      />
      <View style={styles.form}>
        {errorMessage ? (
          <View
            style={styles.errorBanner}
            accessible
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            <Feather name="alert-circle" size={18} color={Colors.error} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <PasswordInput
          label="New password"
          placeholder="At least 6 characters"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) setPasswordError(undefined);
            if (errorMessage) setErrorMessage(null);
          }}
          error={passwordError}
          accessibilityLabel="New password"
          autoComplete="new-password"
        />
        <PasswordInput
          label="Confirm new password"
          placeholder="Re-enter your new password"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (confirmError) setConfirmError(undefined);
            if (errorMessage) setErrorMessage(null);
          }}
          error={confirmError}
          accessibilityLabel="Confirm new password"
          autoComplete="new-password"
          style={styles.fieldSpacing}
        />
        <PrimaryButton
          title="Update Password"
          onPress={handleSubmit}
          isLoading={isLoading}
          accessibilityLabel="Update Password"
          style={styles.submitBtn}
        />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    width: '100%',
    marginTop: Layout.spacing.sm,
  },
  fieldSpacing: {
    marginTop: Layout.spacing.md,
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
  errorText: {
    ...Typography.bodySmall,
    color: Colors.error,
    flex: 1,
    fontWeight: '500',
    marginLeft: Layout.spacing.sm,
  },
  submitBtn: {
    marginTop: Layout.spacing.xl,
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
    marginBottom: Layout.spacing.sm,
  },
  successBody: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Layout.spacing.xl,
  },
  fullWidth: {
    width: '100%',
  },
});

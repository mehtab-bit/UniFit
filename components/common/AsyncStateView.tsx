import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { PrimaryButton } from './PrimaryButton';

interface AsyncStateViewProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

export const AsyncStateView: React.FC<AsyncStateViewProps> = ({
  loading = false,
  error = null,
  empty = false,
  emptyMessage = 'No data available yet.',
  onRetry,
  children,
}) => {
  if (loading) {
    return (
      <View
        style={styles.centerContainer}
        accessible={true}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading data"
      >
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your fitness plan...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={styles.centerContainer}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel={`Error: ${error}`}
      >
        <Feather name="alert-circle" size={40} color={Colors.error} style={{ marginBottom: 12 }} />
        <Text style={styles.errorTitle}>Unable to load content</Text>
        <Text style={styles.errorText}>{error}</Text>
        {onRetry ? (
          <View style={styles.retryBtnContainer}>
            <PrimaryButton
              title="Try Again"
              onPress={onRetry}
              accessibilityLabel="Retry loading content"
            />
          </View>
        ) : null}
      </View>
    );
  }

  if (empty) {
    return (
      <View
        style={styles.centerContainer}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={emptyMessage}
      >
        <Feather name="inbox" size={36} color={Colors.textMuted} style={{ marginBottom: 12 }} />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  centerContainer: {
    padding: Layout.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.md,
  },
  errorTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: 4,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.lg,
  },
  retryBtnContainer: {
    width: 180,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

export interface LoadingScreenProps {
  message?: string;
  theme?: 'light' | 'dark';
  style?: ViewStyle;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading UniFit...',
  theme = 'dark',
  style,
}) => {
  const isDark = theme === 'dark';

  return (
    <View
      style={[
        styles.container,
        isDark ? styles.containerDark : styles.containerLight,
        style,
      ]}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={message}
    >
      <ActivityIndicator
        size="large"
        color={isDark ? Colors.primaryLight : Colors.primary}
        style={styles.spinner}
      />
      <Text
        style={[
          styles.text,
          isDark ? styles.textDark : styles.textLight,
        ]}
      >
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.xl,
  },
  containerDark: {
    backgroundColor: 'transparent',
  },
  containerLight: {
    backgroundColor: Colors.background,
  },
  spinner: {
    marginBottom: Layout.spacing.sm + 4,
  },
  text: {
    ...Typography.bodyMedium,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  textDark: {
    color: Colors.textInverseMuted,
  },
  textLight: {
    color: Colors.textSecondary,
  },
});

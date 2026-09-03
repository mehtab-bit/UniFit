import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

export interface LogoHeaderProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showTaglines?: boolean;
  theme?: 'light' | 'dark';
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
}

export const LogoHeader: React.FC<LogoHeaderProps> = ({
  size = 'md',
  showTaglines = true,
  theme = 'light',
  title,
  subtitle,
  style,
}) => {
  const isDark = theme === 'dark';

  const getLogoDimension = () => {
    switch (size) {
      case 'sm':
        return 72;
      case 'md':
        return 96;
      case 'lg':
        return 120;
      case 'hero':
        return 160;
      default:
        return 96;
    }
  };

  const dimension = getLogoDimension();

  return (
    <View
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole="header"
    >
      <View
        style={[
          styles.logoWrapper,
          { width: dimension, height: dimension },
          isDark && styles.logoWrapperDark,
        ]}
      >
        <Image
          source={require('../../assets/images/unifit-logo.png')}
          style={{ width: dimension, height: dimension }}
          resizeMode="contain"
          accessible={true}
          accessibilityRole="image"
          accessibilityLabel="UniFit logo"
        />
      </View>

      {showTaglines ? (
        <View style={styles.taglinesSection} accessible={false} importantForAccessibility="no">
          <Text
            style={[
              styles.primaryTagline,
              isDark ? styles.primaryTaglineDark : styles.primaryTaglineLight,
            ]}
          >
            UNIVERSAL FITNESS
          </Text>
          <Text
            style={[
              styles.secondaryTagline,
              isDark ? styles.secondaryTaglineDark : styles.secondaryTaglineLight,
            ]}
          >
            FITNESS WITHOUT BARRIERS,
          </Text>
          <Text
            style={[
              styles.secondaryTagline,
              isDark ? styles.secondaryTaglineDark : styles.secondaryTaglineLight,
            ]}
          >
            PROGRESS WITHOUT LIMITS
          </Text>
        </View>
      ) : null}

      {title ? (
        <Text
          style={[
            styles.titleText,
            isDark ? styles.titleTextDark : styles.titleTextLight,
          ]}
        >
          {title}
        </Text>
      ) : null}

      {subtitle ? (
        <Text
          style={[
            styles.subtitleText,
            isDark ? styles.subtitleTextDark : styles.subtitleTextLight,
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.lg,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.sm + 4,
  },
  logoWrapperDark: {},
  taglinesSection: {
    alignItems: 'center',
    marginTop: Layout.spacing.xs,
    marginBottom: Layout.spacing.sm,
  },
  primaryTagline: {
    ...Typography.brandPrimary,
    marginBottom: 4,
  },
  primaryTaglineLight: {
    color: Colors.primary,
  },
  primaryTaglineDark: {
    color: Colors.primaryLight,
  },
  secondaryTagline: {
    ...Typography.brandSecondary,
    textAlign: 'center',
  },
  secondaryTaglineLight: {
    color: Colors.textSecondary,
  },
  secondaryTaglineDark: {
    color: Colors.textInverseMuted,
  },
  titleText: {
    ...Typography.h1,
    marginTop: Layout.spacing.md,
    textAlign: 'center',
  },
  titleTextLight: {
    color: Colors.text,
  },
  titleTextDark: {
    color: Colors.textInverse,
  },
  subtitleText: {
    ...Typography.bodyMedium,
    marginTop: Layout.spacing.xs + 2,
    textAlign: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },
  subtitleTextLight: {
    color: Colors.textSecondary,
  },
  subtitleTextDark: {
    color: Colors.textInverseMuted,
  },
});

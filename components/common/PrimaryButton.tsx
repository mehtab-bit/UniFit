import React from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  AccessibilityRole,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { ScalePressable } from '../animations/ScalePressable';

export interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  isLoading = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  textStyle,
  icon,
}) => {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return styles.primaryContainer;
      case 'secondary':
        return styles.secondaryContainer;
      case 'outline':
        return styles.outlineContainer;
      case 'ghost':
        return styles.ghostContainer;
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
        return styles.primaryText;
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      case 'ghost':
        return styles.ghostText;
      default:
        return styles.primaryText;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return styles.sizeSm;
      case 'md':
        return styles.sizeMd;
      case 'lg':
      default:
        return styles.sizeLg;
    }
  };

  const getSpinnerColor = (): string => {
    if (isPrimary) return Colors.textInverse;
    return Colors.primary;
  };

  return (
    <ScalePressable
      activeScale={0.97}
      onPress={onPress}
      disabled={disabled || isLoading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || isLoading, busy: isLoading }}
      style={[
        styles.baseButton,
        getContainerStyle(),
        getSizeStyle(),
        (disabled || isLoading) && styles.disabledContainer,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={getSpinnerColor()} />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text
            style={[
              getTextStyle(),
              icon ? styles.textWithIcon : null,
              disabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </ScalePressable>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: Layout.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Layout.minTouchTarget,
  },
  sizeSm: {
    paddingVertical: Layout.spacing.xs + 2,
    paddingHorizontal: Layout.spacing.md,
    minHeight: 38,
  },
  sizeMd: {
    paddingVertical: Layout.spacing.sm + 2,
    paddingHorizontal: Layout.spacing.lg,
    minHeight: 46,
  },
  sizeLg: {
    paddingVertical: Layout.spacing.md - 2,
    paddingHorizontal: Layout.spacing.xl,
    minHeight: 52,
  },
  primaryContainer: {
    backgroundColor: Colors.primary,
    ...Layout.shadows.subtle,
  },
  secondaryContainer: {
    backgroundColor: Colors.surfaceSecondary,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  disabledContainer: {
    opacity: 0.55,
    backgroundColor: Colors.surfaceBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
  secondaryText: {
    ...Typography.button,
    color: Colors.text,
  },
  outlineText: {
    ...Typography.button,
    color: Colors.primary,
  },
  ghostText: {
    ...Typography.button,
    color: Colors.textMuted,
  },
  disabledText: {
    color: Colors.textMuted,
  },
  textWithIcon: {
    marginLeft: Layout.spacing.sm,
  },
});

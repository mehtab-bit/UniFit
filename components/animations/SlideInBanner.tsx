import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { useAnimationTheme } from '../../context/AnimationContext';

interface SlideInBannerProps {
  message: string;
  type?: 'info' | 'correction' | 'success';
  icon?: keyof typeof Feather.glyphMap;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLiveRegion?: 'polite' | 'assertive';
}

export const SlideInBanner: React.FC<SlideInBannerProps> = ({
  message,
  type = 'info',
  icon,
  style,
  textStyle,
  accessibilityLiveRegion = 'polite',
}) => {
  const { performanceMode, config } = useAnimationTheme();
  const translateY = useSharedValue(performanceMode === 'low_end' ? 0 : -10);
  const opacity = useSharedValue(performanceMode === 'low_end' ? 1 : 0);

  useEffect(() => {
    if (performanceMode === 'low_end' || config.animationDurationScale === 0) {
      translateY.value = 0;
      opacity.value = 1;
      return;
    }

    translateY.value = -10;
    opacity.value = 0;

    translateY.value = withSpring(0, {
      damping: config.springDamping,
      stiffness: config.springStiffness,
    });
    opacity.value = withTiming(1, {
      duration: 220 * config.animationDurationScale,
      easing: Easing.out(Easing.quad),
    });
  }, [message, performanceMode, config, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    if (performanceMode === 'low_end') {
      return {};
    }
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  }, [performanceMode]);

  const getThemeStyles = () => {
    switch (type) {
      case 'correction':
        return {
          bg: Colors.warningBackground,
          border: Colors.warningBorder,
          iconColor: Colors.warning,
          defaultIcon: 'alert-circle' as const,
          textColor: '#92400E',
        };
      case 'success':
        return {
          bg: Colors.successBackground,
          border: Colors.successBorder,
          iconColor: Colors.success,
          defaultIcon: 'check-circle' as const,
          textColor: '#166534',
        };
      case 'info':
      default:
        return {
          bg: Colors.primaryMuted,
          border: '#BFDBFE',
          iconColor: Colors.primary,
          defaultIcon: 'volume-2' as const,
          textColor: Colors.dark,
        };
    }
  };

  const theme = getThemeStyles();
  const iconName = icon || theme.defaultIcon;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: theme.bg, borderColor: theme.border },
        animatedStyle,
        style,
      ]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLiveRegion={accessibilityLiveRegion}
      accessibilityLabel={`Guidance: ${message}`}
    >
      <Feather
        name={iconName}
        size={18}
        color={theme.iconColor}
        style={styles.icon}
        accessible={false}
        importantForAccessibility="no"
      />
      <Text style={[styles.text, { color: theme.textColor }, textStyle]}>
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    ...Layout.shadows.subtle,
  },
  icon: {
    marginRight: Layout.spacing.sm,
    marginTop: 1,
  },
  text: {
    ...Typography.bodyMedium,
    flex: 1,
    lineHeight: 20,
    fontWeight: '600',
  },
});

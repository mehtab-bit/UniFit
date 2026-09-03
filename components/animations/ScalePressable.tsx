import React, { useCallback } from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
  AccessibilityRole,
  AccessibilityState,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  cancelAnimation,
} from 'react-native-reanimated';
import { useAnimationTheme } from '../../context/AnimationContext';

export interface ScalePressableProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  activeScale?: number;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: AccessibilityState;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ScalePressable: React.FC<ScalePressableProps> = ({
  children,
  style,
  activeScale = 0.96,
  disabled = false,
  onPress,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  ...rest
}) => {
  const { performanceMode, config } = useAnimationTheme();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (disabled || performanceMode === 'low_end') return;
    cancelAnimation(scale);
    scale.value = withSpring(activeScale, {
      damping: config.springDamping,
      stiffness: config.springStiffness,
    });
  }, [disabled, performanceMode, activeScale, config, scale]);

  const handlePressOut = useCallback(() => {
    if (disabled || performanceMode === 'low_end') return;
    cancelAnimation(scale);
    scale.value = withSpring(1, {
      damping: config.springDamping,
      stiffness: config.springStiffness,
    });
  }, [disabled, performanceMode, config, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    if (performanceMode === 'low_end') {
      return {};
    }
    return {
      transform: [{ scale: scale.value }],
    };
  }, [performanceMode]);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessible={true}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, ...accessibilityState }}
      style={[style, animatedStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
};

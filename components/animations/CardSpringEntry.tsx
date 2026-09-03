import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useAnimationTheme } from '../../context/AnimationContext';

interface CardSpringEntryProps {
  children: React.ReactNode;
  index?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

export const CardSpringEntry: React.FC<CardSpringEntryProps> = ({
  children,
  index = 0,
  delay = 0,
  style,
}) => {
  const { performanceMode, config } = useAnimationTheme();
  const opacity = useSharedValue(performanceMode === 'low_end' ? 1 : 0);
  const translateY = useSharedValue(performanceMode === 'low_end' ? 0 : 16);

  useEffect(() => {
    if (performanceMode === 'low_end' || !config.enableSpringEntries) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }

    const calculatedDelay = delay || index * 60;

    opacity.value = withDelay(
      calculatedDelay,
      withTiming(1, { duration: 320 * config.animationDurationScale, easing: Easing.out(Easing.quad) })
    );

    translateY.value = withDelay(
      calculatedDelay,
      withSpring(0, {
        damping: config.springDamping,
        stiffness: config.springStiffness,
      })
    );
  }, [performanceMode, config, index, delay, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    if (performanceMode === 'low_end') {
      return {};
    }
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  }, [performanceMode]);

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
};

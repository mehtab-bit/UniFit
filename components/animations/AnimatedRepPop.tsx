import React, { useEffect } from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle, StyleProp, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { useAnimationTheme } from '../../context/AnimationContext';
import { Colors, SurfaceType } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { useSurfaceColors } from '../../context/SurfaceContext';

interface AnimatedRepPopProps {
  repCount: number;
  label?: string;
  surface?: SurfaceType;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export const AnimatedRepPop: React.FC<AnimatedRepPopProps> = ({
  repCount,
  label = 'Reps Counted',
  surface,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const colors = useSurfaceColors(surface);
  const { performanceMode, config } = useAnimationTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (repCount > 0 && performanceMode !== 'low_end' && config.enableRepPopScaling) {
      cancelAnimation(scale);
      scale.value = withSequence(
        withSpring(1.35, { damping: 10, stiffness: 220 }),
        withSpring(1.0, { damping: config.springDamping, stiffness: config.springStiffness })
      );
    }
  }, [repCount, performanceMode, config, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    if (performanceMode === 'low_end') {
      return {};
    }
    return {
      transform: [{ scale: scale.value }],
    };
  }, [performanceMode]);

  const fullLabel = accessibilityLabel || `${repCount} ${label}`;

  return (
    <View
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
      accessibilityLabel={fullLabel}
    >
      <Animated.Text
        style={[
          styles.repText,
          { color: colors.number },
          textStyle,
          animatedStyle,
        ]}
      >
        {repCount}
      </Animated.Text>
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  repText: {
    fontSize: 32,
    fontWeight: '800',
  },
  label: {
    ...Typography.caption,
    marginTop: 2,
    fontWeight: '600',
  },
});

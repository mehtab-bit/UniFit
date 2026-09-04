import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, SurfaceType } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { useAnimationTheme } from '../../context/AnimationContext';
import { useSurfaceColors } from '../../context/SurfaceContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface AnimatedProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
  showPercentText?: boolean;
  surface?: SurfaceType;
  textColor?: string;
  labelColor?: string;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export const AnimatedProgressRing: React.FC<AnimatedProgressRingProps> = ({
  progress,
  size = 90,
  strokeWidth = 8,
  color,
  backgroundColor,
  label,
  showPercentText = true,
  surface,
  textColor,
  labelColor,
  style,
  accessibilityLabel,
}) => {
  const colors = useSurfaceColors(surface);
  const effectiveArcColor = color || colors.accent;
  const effectiveTrackColor = backgroundColor || (surface === 'dark' ? colors.track : Colors.surfaceBorder);
  const effectiveTextColor = textColor || colors.number;
  const effectiveLabelColor = labelColor || colors.textSecondary;

  const { performanceMode, config } = useAnimationTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedProgress = Math.min(100, Math.max(0, progress)) / 100;

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    if (performanceMode === 'low_end' || !config.enableSvgRingAnimations) {
      animatedProgress.value = normalizedProgress;
    } else {
      animatedProgress.value = withTiming(normalizedProgress, {
        duration: 900 * config.animationDurationScale,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [normalizedProgress, performanceMode, config, animatedProgress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - animatedProgress.value);
    return {
      strokeDashoffset,
    };
  });

  const a11yLabel = accessibilityLabel || (label ? `${label}: ${Math.round(progress)} percent` : `${Math.round(progress)} percent completed`);

  return (
    <View
      style={[styles.container, { width: size, height: size }, style]}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress) }}
      accessibilityLabel={a11yLabel}
    >
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background Track Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={effectiveTrackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated Progress Circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={effectiveArcColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          fill="none"
          originX={size / 2}
          originY={size / 2}
          rotation="-90"
        />
      </Svg>

      {showPercentText && (
        <View style={styles.centerContent} accessible={false} importantForAccessibility="no">
          <Text style={[styles.percentText, { color: effectiveTextColor }]}>{Math.round(progress)}%</Text>
          {label ? <Text style={[styles.labelText, { color: effectiveLabelColor }]}>{label}</Text> : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    ...Typography.h3,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  labelText: {
    ...Typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: 1,
  },
});

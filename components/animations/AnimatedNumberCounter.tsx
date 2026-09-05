import React, { useEffect, useState, useRef } from 'react';
import { Text, TextStyle, StyleSheet, StyleProp } from 'react-native';
import { useAnimationTheme } from '../../context/AnimationContext';
import { Colors, SurfaceType } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { useSurfaceColors } from '../../context/SurfaceContext';

interface AnimatedNumberCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  surface?: SurfaceType;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  formatter?: (n: number) => string;
}

export const AnimatedNumberCounter: React.FC<AnimatedNumberCounterProps> = ({
  value,
  duration = 800,
  prefix = '',
  suffix = '',
  surface,
  style,
  accessibilityLabel,
  formatter,
}) => {
  const colors = useSurfaceColors(surface);
  const { performanceMode, config } = useAnimationTheme();
  const [displayValue, setDisplayValue] = useState(performanceMode === 'low_end' ? value : 0);
  const prevValueRef = useRef(0);

  useEffect(() => {
    if (performanceMode === 'low_end' || config.animationDurationScale === 0) {
      setDisplayValue(value);
      prevValueRef.current = value;
      return;
    }

    const startVal = prevValueRef.current;
    const endVal = value;
    const startTime = Date.now();
    const effectiveDuration = duration * config.animationDurationScale;

    let frameId: number;

    const tick = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / effectiveDuration);

      // Ease-out cubic calculation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * easeOut);

      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        prevValueRef.current = endVal;
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [value, duration, performanceMode, config.animationDurationScale]);

  const formattedText = formatter
    ? formatter(displayValue)
    : `${prefix}${displayValue.toLocaleString()}${suffix}`;

  const fullLabel =
    accessibilityLabel ||
    (formatter ? formatter(value) : `${prefix}${value.toLocaleString()}${suffix}`);

  return (
    <Text
      style={[styles.defaultText, { color: colors.number }, style]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.6}
      maxFontSizeMultiplier={1.3}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={fullLabel}
    >
      {formattedText}
    </Text>
  );
};

const styles = StyleSheet.create({
  defaultText: {
    ...Typography.h2,
  },
});

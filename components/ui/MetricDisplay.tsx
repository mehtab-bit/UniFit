import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useSurfaceColors } from '../../context/SurfaceContext';
import { SurfaceType } from '../../constants/colors';

export interface MetricDisplayProps {
  value: string | number;
  label: string;
  sublabel?: string;
  surface?: SurfaceType;
  style?: StyleProp<ViewStyle>;
  valueStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  sublabelStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

/**
 * Shared Metric Display component with surface-aware contrast.
 * On dark surfaces: value is bold pure #FFFFFF, label is #00C8FF, sublabel is #94A3B8.
 * On light surfaces: value is #040E34, label is #2166BF, sublabel is #4B5563.
 */
export const MetricDisplay: React.FC<MetricDisplayProps> = ({
  value,
  label,
  sublabel,
  surface,
  style,
  valueStyle,
  labelStyle,
  sublabelStyle,
  accessibilityLabel,
}) => {
  const colors = useSurfaceColors(surface);

  return (
    <View
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={
        accessibilityLabel || `${label}: ${value}${sublabel ? ` ${sublabel}` : ''}`
      }
    >
      <Text style={[styles.value, { color: colors.number }, valueStyle]}>
        {value}
      </Text>
      <Text style={[styles.label, { color: colors.accent }, labelStyle]}>
        {label}
      </Text>
      {sublabel ? (
        <Text style={[styles.sublabel, { color: colors.textMuted }, sublabelStyle]}>
          {sublabel}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  sublabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});

import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, SurfaceType } from '../../constants/colors';
import { useSurfaceColors } from '../../context/SurfaceContext';

interface ProgressRingProps {
  progress: number;
  size: number;
  strokeWidth: number;
  color?: string;
  backgroundColor?: string;
  surface?: SurfaceType;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size,
  strokeWidth,
  color,
  backgroundColor,
  surface,
  children,
}) => {
  const colors = useSurfaceColors(surface);
  const effectiveArcColor = color || (surface === 'dark' ? colors.accent : Colors.primary);
  const effectiveTrackColor = backgroundColor || (surface === 'dark' ? colors.track : '#E2E8F0');
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const boundedProgress = Math.max(0, Math.min(1, progress));
  const strokeDashoffset = circumference - boundedProgress * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          stroke={effectiveTrackColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={effectiveArcColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      {children}
    </View>
  );
};

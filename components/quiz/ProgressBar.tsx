import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

export interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps = 12,
}) => {
  const animatedProgress = useRef(new Animated.Value(currentStep / totalSteps)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: Math.min(Math.max(currentStep / totalSteps, 0), 1),
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep, totalSteps, animatedProgress]);

  const progressPercent = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const percentNumber = Math.round((currentStep / totalSteps) * 100);

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${currentStep} of ${totalSteps}. ${percentNumber}% complete.`}
      accessibilityValue={{
        min: 1,
        max: totalSteps,
        now: currentStep,
        text: `${percentNumber}% complete`,
      }}
    >
      <View style={styles.textRow}>
        <Text style={styles.stepText}>
          Step <Text style={styles.stepHighlight}>{currentStep}</Text> of {totalSteps}
        </Text>
        <Text style={styles.percentText}>{percentNumber}%</Text>
      </View>

      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: progressPercent }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: Layout.spacing.xs,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs + 2,
  },
  stepText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  stepHighlight: {
    color: Colors.primary,
    fontWeight: '700',
  },
  percentText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: 12,
  },
  track: {
    height: 6,
    width: '100%',
    backgroundColor: Colors.border,
    borderRadius: Layout.borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius.full,
  },
});

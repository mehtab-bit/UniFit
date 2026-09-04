import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { useAnimationTheme } from '../../context/AnimationContext';
import { PrimaryButton } from '../common/PrimaryButton';

interface WorkoutCompleteBadgeProps {
  visible: boolean;
  exerciseName: string;
  reps: number;
  formScore?: number | null;
  source?: 'camera' | 'manual' | 'activity';
  onClose: () => void;
}

export const WorkoutCompleteBadge: React.FC<WorkoutCompleteBadgeProps> = ({
  visible,
  exerciseName,
  reps,
  formScore,
  source = 'camera',
  onClose,
}) => {
  const { performanceMode, config } = useAnimationTheme();
  const scale = useSharedValue(performanceMode === 'low_end' ? 1 : 0.8);
  const checkScale = useSharedValue(performanceMode === 'low_end' ? 1 : 0);

  useEffect(() => {
    if (visible) {
      if (performanceMode === 'low_end') {
        scale.value = 1;
        checkScale.value = 1;
      } else {
        scale.value = withSpring(1, {
          damping: config.springDamping,
          stiffness: config.springStiffness,
        });
        checkScale.value = withSequence(
          withTiming(0, { duration: 150 }),
          withSpring(1.2, { damping: 10, stiffness: 180 }),
          withSpring(1.0, { damping: 14, stiffness: 140 })
        );
      }
    } else {
      scale.value = 0.8;
      checkScale.value = 0;
    }
  }, [visible, performanceMode, config, scale, checkScale]);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    if (performanceMode === 'low_end') return {};
    return {
      transform: [{ scale: scale.value }],
    };
  }, [performanceMode]);

  const checkAnimatedStyle = useAnimatedStyle(() => {
    if (performanceMode === 'low_end') return {};
    return {
      transform: [{ scale: checkScale.value }],
    };
  }, [performanceMode]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType={performanceMode === 'low_end' ? 'none' : 'fade'}
      visible={visible}
      onRequestClose={onClose}
      accessible={true}
      accessibilityViewIsModal={true}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.card, cardAnimatedStyle]}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLabel={
            source === 'camera'
              ? `Workout Complete! ${exerciseName}. Completed ${reps} repetitions with ${formScore} percent range score.`
              : source === 'activity'
                ? `Workout Complete! ${exerciseName}. ${reps} minute session recorded.`
                : `Exercise complete. ${exerciseName}. Completed ${reps} repetitions manually.`
          }
        >
          {/* Checkmark badge */}
          <Animated.View style={[styles.checkCircle, checkAnimatedStyle]}>
            <Feather name="check" size={32} color={Colors.textInverse} />
          </Animated.View>

          <Text style={styles.title}>Workout Complete</Text>
          <Text style={styles.subtitle}>{exerciseName}</Text>

          {/* Stats Box */}
          <View style={styles.statsContainer}>
          <View style={styles.statBox}>
              <Text style={styles.statNumber}>{reps}</Text>
              <Text style={styles.statLabel}>
                {source === 'activity' ? 'MINUTES' : 'REPS'}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statBox}>
              {source === 'activity' ? (
                <>
                  <Text style={[styles.statNumber, { color: Colors.success }]}>
                    DONE
                  </Text>
                  <Text style={styles.statLabel}>SESSION</Text>
                </>
              ) : source === 'camera' && typeof formScore === 'number' ? (
                <>
                  <Text style={[styles.statNumber, { color: Colors.primary }]}>
                    {formScore}%
                  </Text>
                  <Text style={styles.statLabel}>RANGE SCORE</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.statNumber, { color: Colors.primary }]}>
                    MANUAL
                  </Text>
                  <Text style={styles.statLabel}>RECORDING</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.qualityPill}>
            <Feather name="award" size={14} color={Colors.success} style={{ marginRight: 4 }} />
            <Text style={styles.qualityText}>
              {source === 'activity'
                ? 'Activity session recorded'
                : source === 'camera'
                ? 'Range calibrated & saved'
                : 'Manual reps recorded — no camera used'}
            </Text>
          </View>

          <PrimaryButton
            title="Continue to Dashboard"
            onPress={onClose}
            size="md"
            accessibilityLabel="Continue to Dashboard"
            accessibilityHint="Closes completion summary and returns to workouts"
            style={styles.continueBtn}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Layout.shadows.card,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.md,
    ...Layout.shadows.subtle,
  },
  title: {
    ...Typography.h2,
    fontSize: 22,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Layout.spacing.lg,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Layout.borderRadius.lg,
    paddingVertical: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },
  qualityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successBackground,
    paddingHorizontal: Layout.spacing.sm + 2,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.full,
    marginBottom: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.successBorder,
  },
  qualityText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.success,
    fontWeight: '700',
  },
  continueBtn: {
    width: '100%',
  },
});

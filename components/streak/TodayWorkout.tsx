import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { PlanWorkoutItem } from '../../types/streak';
import { ScalePressable } from '../animations/ScalePressable';

interface TodayWorkoutProps {
  workout: PlanWorkoutItem;
  onStartWorkout: () => void;
}

export const TodayWorkout: React.FC<TodayWorkoutProps> = ({
  workout,
  onStartWorkout,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionHeader} accessible={true} accessibilityRole="header">
          TODAY
        </Text>
        <View style={styles.todayBadge}>
          <Text style={styles.todayBadgeText}>Today's workout</Text>
        </View>
      </View>

      <View
        style={styles.card}
        accessible={true}
        accessibilityRole="summary"
        accessibilityLabel={`Today's workout: ${workout.title}. ${workout.focus}. ${workout.meta}.`}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="dumbbell" size={24} color={Colors.primary} />
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.workoutTitle}>{workout.title}</Text>
            <Text style={styles.workoutMeta}>{workout.meta || workout.focus}</Text>
          </View>
        </View>

        {/* Primary CTA Button */}
        <ScalePressable
          activeScale={0.96}
          onPress={onStartWorkout}
          accessibilityRole="button"
          accessibilityLabel={`Start Workout: ${workout.title}`}
          accessibilityHint="Launches the exercise coaching and rep counter session"
          style={styles.ctaButton}
        >
          <Feather name="play" size={18} color={Colors.textInverse} style={styles.playIcon} />
          <Text style={styles.ctaButtonText}>Start Workout</Text>
        </ScalePressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.sm,
  },
  sectionHeader: {
    ...Typography.caption,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 1.2,
    fontSize: 11,
  },
  todayBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  todayBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    ...Layout.shadows.card,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  infoCol: {
    flex: 1,
  },
  workoutTitle: {
    ...Typography.h3,
    fontSize: 18,
    color: Colors.text,
    marginBottom: 2,
  },
  workoutFocus: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  workoutMeta: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Layout.borderRadius.lg,
    paddingVertical: Layout.spacing.md,
    minHeight: 48,
    ...Layout.shadows.subtle,
  },
  playIcon: {
    marginRight: Layout.spacing.sm,
  },
  ctaButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.textInverse,
  },
});

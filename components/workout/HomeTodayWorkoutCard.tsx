import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Layout } from '../../constants/layout';
import { WorkoutDay } from '../../types/domain';
import { ScalePressable } from '../animations/ScalePressable';
import { Typography } from '../../constants/typography';

interface HomeTodayWorkoutCardProps {
  workout: WorkoutDay;
  onStartWorkout: () => void;
  onViewPlan: () => void;
}

export const HomeTodayWorkoutCard: React.FC<HomeTodayWorkoutCardProps> = ({
  workout,
  onStartWorkout,
  onViewPlan,
}) => {
  const isRest = workout.category?.toLowerCase() === 'rest' || workout.activity === 'rest';

  const exercisesCount = workout.exercises?.length || (workout.sets ? Math.round(workout.sets / 2) : 5);
  const duration = workout.durationMinutes || 25;
  const category = workout.category || 'Strength';

  return (
    <View
      style={styles.heroSurface}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`Today's Workout: ${workout.title}. ${isRest ? 'Rest day' : `${duration} minutes, ${exercisesCount} exercises, ${category}`}.`}
    >
      <View style={styles.topRow}>
        <Text style={styles.todayText}>TODAY'S WORKOUT</Text>
        <ScalePressable onPress={onViewPlan}>
          <Feather name="more-horizontal" size={20} color="#94A3B8" />
        </ScalePressable>
      </View>

      <Text style={styles.titleText}>{workout.title.toUpperCase()}</Text>

      {isRest ? (
        <Text style={styles.metadataText}>RECOVERY & HYDRATION</Text>
      ) : (
        <Text style={styles.metadataText}>
          {category.toUpperCase()} • {duration} MIN • {exercisesCount} EXERCISES
        </Text>
      )}

      {!isRest ? (
        <ScalePressable
          activeScale={0.98}
          onPress={onStartWorkout}
          accessibilityRole="button"
          style={styles.ctaButton}
        >
          <Text style={styles.ctaButtonText}>Start Workout</Text>
          <Feather name="arrow-right" size={16} color="#0F172A" style={{ marginLeft: 6 }} />
        </ScalePressable>
      ) : (
        <View style={styles.restBanner}>
          <Feather name="coffee" size={14} color="#059669" style={{ marginRight: 6 }} />
          <Text style={styles.restBannerText}>Rest day — Focus on sleep & recovery</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  heroSurface: {
    backgroundColor: '#0F172A',
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.xl,
    marginBottom: Layout.spacing.md,
    ...Layout.shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  todayText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1.2,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: Layout.spacing.xl,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: Layout.borderRadius.full,
  },
  ctaButtonText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  restBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Layout.borderRadius.md,
  },
  restBannerText: {
    ...Typography.caption,
    color: '#10B981',
    fontWeight: '600',
    fontSize: 13,
  },
});

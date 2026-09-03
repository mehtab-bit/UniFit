import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { WorkoutActivityType, WorkoutIntensity } from '../../types/domain';
import { ScalePressable } from '../animations/ScalePressable';

interface WorkoutHeaderProps {
  title: string;
  focus?: string;
  activity: WorkoutActivityType;
  intensity?: WorkoutIntensity;
  durationMinutes?: number;
  exercisesCount?: number;
  distanceKm?: number;
  equipment?: string;
  onStartWorkout?: () => void;
  isSessionActive?: boolean;
  completedExercisesCount?: number;
}

export const WorkoutHeader: React.FC<WorkoutHeaderProps> = ({
  title,
  focus,
  activity,
  intensity,
  durationMinutes = 25,
  exercisesCount = 0,
  distanceKm,
  equipment,
  onStartWorkout,
  isSessionActive = false,
  completedExercisesCount = 0,
}) => {
  const isRest = activity === 'rest';
  const isStrength = activity === 'strength';
  const hasExercises = exercisesCount > 0;

  // Derive secondary metric based on activity
  let secondaryMetric = `${exercisesCount} EXERCISES`;
  if (isRest) {
    secondaryMetric = 'ACTIVE RECOVERY';
  } else if (distanceKm) {
    secondaryMetric = `${distanceKm} KM`;
  } else if (activity === 'running') {
    secondaryMetric = 'CARDIO';
  } else if (activity === 'cycling') {
    secondaryMetric = 'ENDURANCE';
  } else if (activity === 'walking') {
    secondaryMetric = 'BRISK WALK';
  } else if (activity === 'swimming') {
    secondaryMetric = 'AEROBIC SWIM';
  }

  const accessibilityLabel = isRest
    ? `Rest Day: ${title}. Recovery and mobility.`
    : isStrength && hasExercises
    ? `Workout: ${title}. ${durationMinutes} minutes. ${exercisesCount} exercises.`
    : `Workout: ${title}. ${durationMinutes} minutes.${distanceKm ? ` ${distanceKm} kilometers.` : ''}`;

  return (
    <View
      style={styles.heroCard}
      accessible={true}
      accessibilityRole="header"
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={styles.heroTitle}>{title.toUpperCase()}</Text>
      
      <View style={styles.metricsRow}>
        {!isRest && durationMinutes > 0 ? (
          <>
            <Text style={styles.metricsText}>{durationMinutes} MIN</Text>
            <Text style={styles.metricsDot}>·</Text>
          </>
        ) : null}
        <Text style={styles.metricsText}>{secondaryMetric}</Text>
      </View>

      {!isSessionActive && onStartWorkout && !isRest ? (
        <ScalePressable
          activeScale={0.97}
          onPress={onStartWorkout}
          accessibilityRole="button"
          accessibilityLabel={`Start workout: ${title}`}
          style={styles.heroCtaBtn}
        >
          <Text style={styles.heroCtaText}>[ START WORKOUT ]</Text>
        </ScalePressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: '#000000',
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.xl,
    marginBottom: Layout.spacing.md,
    alignItems: 'center',
    ...Layout.shadows.card,
  },
  heroTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.xl,
  },
  metricsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#A1A1AA',
    letterSpacing: 1,
  },
  metricsDot: {
    fontSize: 16,
    fontWeight: '700',
    color: '#71717A',
    marginHorizontal: 8,
  },
  heroCtaBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: Layout.borderRadius.full,
  },
  heroCtaText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 2,
  },
});


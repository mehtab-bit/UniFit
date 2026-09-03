import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
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
  exercisesCount = 5,
  distanceKm,
  equipment,
  onStartWorkout,
  isSessionActive = false,
  completedExercisesCount = 0,
}) => {
  const isRest = activity === 'rest';

  return (
    <View
      style={styles.heroCard}
      accessible={true}
      accessibilityRole="header"
      accessibilityLabel={`Workout: ${title}. ${durationMinutes} minutes. ${exercisesCount} exercises.`}
    >
      {/* Top Label Tag */}
      <View style={styles.topBadgeRow}>
        <View style={styles.activityBadge}>
          <Text style={styles.activityBadgeText}>
            {activity.toUpperCase()} SESSION
          </Text>
        </View>

        {intensity ? (
          <View style={styles.intensityBadge}>
            <Text style={styles.intensityBadgeText}>
              {intensity.toUpperCase()} INTENSITY
            </Text>
          </View>
        ) : null}
      </View>

      {/* Hero Title */}
      <Text style={styles.heroTitle}>{title.toUpperCase()}</Text>
      {focus ? <Text style={styles.heroFocus}>{focus}</Text> : null}

      {/* Big Hero Numbers */}
      <View style={styles.heroMetricsGrid}>
        {durationMinutes && durationMinutes > 0 ? (
          <View style={styles.metricItem}>
            <Text style={styles.metricNumber}>{durationMinutes}</Text>
            <Text style={styles.metricLabel}>MINUTES</Text>
          </View>
        ) : null}

        {exercisesCount && exercisesCount > 0 ? (
          <View style={styles.metricItem}>
            <Text style={styles.metricNumber}>{exercisesCount}</Text>
            <Text style={styles.metricLabel}>EXERCISES</Text>
          </View>
        ) : null}

        {distanceKm && distanceKm > 0 ? (
          <View style={styles.metricItem}>
            <Text style={styles.metricNumber}>{distanceKm}</Text>
            <Text style={styles.metricLabel}>KM</Text>
          </View>
        ) : null}

        <View style={styles.metricItem}>
          <Text style={[styles.metricNumber, { color: Colors.brandCyan }]}>
            {activity === 'strength' ? 'CALIB' : 'ZONE 2'}
          </Text>
          <Text style={styles.metricLabel}>FOCUS</Text>
        </View>
      </View>

      {/* Equipment Row */}
      {equipment ? (
        <View style={styles.equipmentRow}>
          <Feather name="box" size={12} color={Colors.textInverseMuted} style={{ marginRight: 6 }} />
          <Text style={styles.equipmentText}>
            <Text style={{ fontWeight: '700', color: Colors.textInverse }}>Equipment: </Text>
            {equipment}
          </Text>
        </View>
      ) : null}

      {/* Main Single Start Workout CTA */}
      {!isRest && onStartWorkout && !isSessionActive ? (
        <ScalePressable
          activeScale={0.97}
          onPress={onStartWorkout}
          accessibilityRole="button"
          accessibilityLabel={`Start workout: ${title}`}
          accessibilityHint="Starts the guided exercise session"
          style={styles.heroCtaBtn}
        >
          <Feather name="play" size={18} color="#001554" style={{ marginRight: 8 }} />
          <Text style={styles.heroCtaText}>Start Workout</Text>
        </ScalePressable>
      ) : null}

      {/* Progress Dots Visualization */}
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>PROGRESS:</Text>
        <View style={styles.dotsContainer}>
          {Array.from({ length: exercisesCount }).map((_, idx) => {
            const isDone = idx < completedExercisesCount;
            const isCurrent = idx === completedExercisesCount && isSessionActive;
            return (
              <View
                key={idx}
                style={[
                  styles.progressDot,
                  isDone && styles.progressDotDone,
                  isCurrent && styles.progressDotCurrent,
                ]}
              />
            );
          })}
        </View>
        <Text style={styles.progressCount}>
          {completedExercisesCount} / {exercisesCount}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: '#001554',
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    borderWidth: 1,
    borderColor: '#07328D',
    ...Layout.shadows.card,
  },
  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  activityBadge: {
    backgroundColor: '#07328D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: '#2166BF',
  },
  activityBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: '#00C8FF',
    letterSpacing: 1,
  },
  intensityBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Layout.borderRadius.full,
  },
  intensityBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: '#CBD5E1',
    letterSpacing: 0.8,
  },
  heroTitle: {
    ...Typography.h1,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: Colors.textInverse,
    letterSpacing: -0.3,
  },
  heroFocus: {
    ...Typography.bodySmall,
    color: '#9E9FA9',
    fontSize: 13,
    marginTop: 4,
  },
  heroMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 20,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  metricItem: {
    alignItems: 'flex-start',
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textInverse,
    letterSpacing: -0.5,
  },
  metricLabel: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: '#9E9FA9',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Layout.borderRadius.md,
  },
  equipmentText: {
    ...Typography.caption,
    fontSize: 12,
    color: '#CBD5E1',
  },
  heroCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00C8FF',
    paddingVertical: 14,
    borderRadius: Layout.borderRadius.lg,
    marginTop: 18,
  },
  heroCtaText: {
    ...Typography.button,
    fontSize: 15,
    fontWeight: '800',
    color: '#001554',
    letterSpacing: 0.5,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressLabel: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: '#9E9FA9',
    letterSpacing: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressDotDone: {
    backgroundColor: '#00C8FF',
  },
  progressDotCurrent: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#00C8FF',
    transform: [{ scale: 1.2 }],
  },
  progressCount: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
  },
});

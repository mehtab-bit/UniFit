import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { WorkoutDay } from '../../types/domain';
import { ScalePressable } from '../animations/ScalePressable';

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
      style={styles.card}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`Today's Workout: ${workout.title}. ${isRest ? 'Rest day' : `${duration} minutes, ${exercisesCount} exercises, ${category}`}.`}
    >
      {/* Top Header Row */}
      <View style={styles.topHeaderRow}>
        <View style={styles.todayPill}>
          <View style={styles.pulseDot} />
          <Text style={styles.todayPillText}>TODAY'S WORKOUT</Text>
        </View>

        <ScalePressable
          onPress={onViewPlan}
          accessibilityRole="button"
          accessibilityLabel="View week plan"
          style={styles.viewPlanLink}
        >
          <Text style={styles.viewPlanLinkText}>Week Plan</Text>
          <Feather name="chevron-right" size={12} color={Colors.primary} />
        </ScalePressable>
      </View>

      {/* Main Info Row */}
      <View style={styles.workoutBodyRow}>
        <View style={styles.iconCircle} accessible={false} importantForAccessibility="no">
          <MaterialCommunityIcons
            name={(workout.iconName as any) || (isRest ? 'heart' : 'dumbbell')}
            size={22}
            color={Colors.primary}
          />
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.titleText}>{workout.title}</Text>
          {isRest ? (
            <Text style={styles.metadataText}>Recovery & Hydration</Text>
          ) : (
            <Text style={styles.metadataText}>
              <Text style={styles.boldMetaNum}>{duration}</Text> min · <Text style={styles.boldMetaNum}>{exercisesCount}</Text> exercises · {category}
            </Text>
          )}
        </View>
      </View>

      {/* Primary CTA Button */}
      {!isRest ? (
        <ScalePressable
          activeScale={0.98}
          onPress={onStartWorkout}
          accessibilityRole="button"
          accessibilityLabel={`Start workout: ${workout.title}`}
          accessibilityHint="Launches exercise coach"
          style={styles.ctaButton}
        >
          <Text style={styles.ctaButtonText}>Start Workout</Text>
          <Feather name="arrow-right" size={15} color={Colors.textInverse} style={{ marginLeft: 6 }} />
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.md,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    marginBottom: Layout.spacing.md,
    ...Layout.shadows.card,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.sm,
  },
  todayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Layout.borderRadius.full,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 6,
  },
  todayPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.6,
  },
  viewPlanLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  viewPlanLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    marginRight: 2,
  },
  workoutBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm + 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#040E34',
    letterSpacing: -0.3,
  },
  metadataText: {
    color: '#4B5563',
    fontSize: 12.5,
    marginTop: 2,
  },
  boldMetaNum: {
    fontWeight: '800',
    color: '#040E34',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: Layout.borderRadius.lg,
  },
  ctaButtonText: {
    ...Typography.button,
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: '700',
  },
  restBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Layout.borderRadius.md,
  },
  restBannerText: {
    ...Typography.caption,
    color: '#065F46',
    fontWeight: '600',
    fontSize: 12,
  },
});

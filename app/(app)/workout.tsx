import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useScreenAnnouncement } from '../../hooks/useScreenAnnouncement';
import { useAccessibility } from '../../context/AccessibilityContext';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { AnimatedRepPop } from '../../components/animations/AnimatedRepPop';
import { AnimatedNumberCounter } from '../../components/animations/AnimatedNumberCounter';
import { AnimatedProgressRing } from '../../components/animations/AnimatedProgressRing';
import { SlideInBanner } from '../../components/animations/SlideInBanner';
import { ScalePressable } from '../../components/animations/ScalePressable';
import { CardSpringEntry } from '../../components/animations/CardSpringEntry';
import { WorkoutCompleteBadge } from '../../components/animations/WorkoutCompleteBadge';
import { AsyncStateView } from '../../components/common/AsyncStateView';

// Reusable Workout Components (Engine-Aligned)
import { WorkoutHeader } from '../../components/workout/WorkoutHeader';
import { WorkoutMeta } from '../../components/workout/WorkoutMeta';
import { WarmupSection } from '../../components/workout/WarmupSection';
import { WorkoutInstructions } from '../../components/workout/WorkoutInstructions';
import { ExerciseList } from '../../components/workout/ExerciseList';
import { FormCues } from '../../components/workout/FormCues';
import { CooldownSection } from '../../components/workout/CooldownSection';
import { AccessibilityGuidance } from '../../components/workout/AccessibilityGuidance';

// Services & Domain Models
import { workoutService, cvService } from '../../services';
import { WorkoutDay, Exercise, WorkoutCompletionPayload } from '../../types/domain';

export default function WorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; dayId?: string }>();
  useScreenAnnouncement('Exercise Coach screen. Choose an exercise or start today’s full plan.');

  const { provideFeedback } = useAccessibility();

  // Data state
  const [workout, setWorkout] = useState<WorkoutDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active session states
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [formScore, setFormScore] = useState(94);
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [completedExerciseIds, setCompletedExerciseIds] = useState<string[]>([]);
  const [lastFeedback, setLastFeedback] = useState('Position yourself in camera frame. Keep a stable base.');
  const [bannerType, setBannerType] = useState<'info' | 'correction' | 'success'>('info');
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const loadWorkoutData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let targetWorkout: WorkoutDay | null = null;
      if (params.date) {
        targetWorkout = await workoutService.getWorkoutByDate(params.date);
      } else if (params.dayId) {
        targetWorkout = await workoutService.getWorkoutByDate(params.dayId);
      }

      if (!targetWorkout) {
        targetWorkout = await workoutService.getTodayWorkout();
      }

      setWorkout(targetWorkout);
      if (targetWorkout.exercises && targetWorkout.exercises.length > 0) {
        setActiveExercise(targetWorkout.exercises[0]);
      } else {
        setActiveExercise(null);
      }
    } catch (err) {
      setError('Unable to load workout program. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [params.date, params.dayId]);

  useEffect(() => {
    loadWorkoutData();
  }, [loadWorkoutData]);

  const handleStartSession = useCallback((ex: Exercise) => {
    setActiveExercise(ex);
    setIsSessionActive(true);
    setRepCount(0);
    setFormScore(96);
    setBannerType('info');
    const startMsg = `${ex.name} session started. Target: ${ex.target}. Sets: ${ex.sets || 2} of ${ex.reps || 8} reps. Follow audio guidance.`;
    setLastFeedback(startMsg);
    provideFeedback({
      text: startMsg,
      priority: 'high',
      haptic: 'success',
    });
  }, [provideFeedback]);

  const handleStartActivitySession = useCallback(() => {
    setIsSessionActive(true);
    setBannerType('info');
    const actTitle = workout?.title || 'Activity';
    const startMsg = `${actTitle} session started. Target: ${workout?.durationMinutes || 20} minutes${workout?.distanceKm ? ` · ${workout.distanceKm} km` : ''}.`;
    setLastFeedback(startMsg);
    provideFeedback({
      text: startMsg,
      priority: 'high',
      haptic: 'success',
    });
  }, [workout, provideFeedback]);

  const handleSimulateRep = useCallback(async () => {
    if (!activeExercise) return;
    const nextRep = repCount + 1;
    setRepCount(nextRep);

    // Movement analysis service boundary
    const feedback = await cvService.getFeedback(activeExercise.name, nextRep);

    setFormScore(feedback.formScore);
    setBannerType(feedback.feedbackType);
    setLastFeedback(feedback.feedbackMessage);

    provideFeedback({
      text: feedback.feedbackMessage,
      repCount: nextRep,
      formScore: feedback.formScore,
      correction: feedback.correction,
      haptic: feedback.correction ? 'warning' : 'light',
    });
  }, [repCount, activeExercise, provideFeedback]);

  const handleEndSession = useCallback(async () => {
    setIsSessionActive(false);
    setShowCompleteModal(true);
    if (activeExercise) {
      setCompletedExerciseIds((prev) => Array.from(new Set([...prev, activeExercise.id])));
    }
    if (workout) {
      const completionPayload: WorkoutCompletionPayload = {
        activity_id: workout.activity_id || workout.activity || 'strength',
        requested_activity_id: workout.requested_activity_id,
        progression_key: workout.progression_key || workout.activity || 'strength',
        session_type: workout.session_type,
        completion_pct: repCount > 0 ? Math.min(100, Math.round((repCount / (workout.reps || 10)) * 100)) : 100,
        exercise_completion_pct: activeExercise
          ? {
              [activeExercise.family || activeExercise.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')]:
                formScore,
            }
          : undefined,
      };
      await workoutService.logWorkoutCompletion(completionPayload);
    }
    const endMsg = `${activeExercise?.name || 'Workout'} session complete. Great adherence!`;
    setLastFeedback(endMsg);
    provideFeedback({
      text: endMsg,
      priority: 'high',
      haptic: 'success',
    });
  }, [activeExercise, workout, repCount, formScore, provideFeedback]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor={Colors.background} />

      {/* Screen Navigation Header */}
      <View style={styles.header} accessible={true} accessibilityRole="header">
        <ScalePressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(app)'))}
          accessibilityRole="button"
          accessibilityLabel="Back to dashboard"
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={20} color={Colors.text} />
        </ScalePressable>
        <Text style={styles.headerTitle}>Exercise Coach</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AsyncStateView loading={loading} error={error} onRetry={loadWorkoutData}>
          {workout ? (
            <>
              {/* Workout Hero Section */}
              <CardSpringEntry index={0}>
                <WorkoutHeader
                  title={workout.title}
                  focus={workout.focus}
                  activity={workout.activity}
                  intensity={workout.intensity}
                  durationMinutes={workout.durationMinutes}
                  exercisesCount={workout.exercises?.length || 0}
                  distanceKm={workout.distanceKm}
                  equipment={workout.equipment}
                  onStartWorkout={() => {
                    if (workout.exercises && workout.exercises.length > 0) {
                      const nextEx = workout.exercises.find((e) => !completedExerciseIds.includes(e.id)) || workout.exercises[0];
                      if (nextEx) handleStartSession(nextEx);
                    } else if (workout.activity !== 'rest') {
                      handleStartActivitySession();
                    }
                  }}
                  isSessionActive={isSessionActive}
                  completedExercisesCount={completedExerciseIds.length}
                />
              </CardSpringEntry>

              {/* Active Exercise Guidance & Motion HUD (Strength) */}
              {isSessionActive && activeExercise ? (
                <CardSpringEntry index={1}>
                  <View
                    style={styles.activeCoachCard}
                    accessible={true}
                    accessibilityRole="alert"
                    accessibilityLabel={`Active exercise: ${activeExercise.name}. Reps: ${repCount}. Form: ${formScore}%.`}
                  >
                    <Text style={styles.activeExerciseTitle}>{activeExercise.name.toUpperCase()}</Text>

                    <View style={styles.hudRingCol}>
                      <AnimatedProgressRing
                        progress={formScore}
                        size={160}
                        strokeWidth={12}
                        color="#00C8FF"
                        backgroundColor="#E2E8F0"
                        label="FORM"
                        textColor="#040E34"
                        labelColor="#4B5563"
                      />
                    </View>

                    <View style={styles.hudMetricsRow}>
                      {/* SET Metric */}
                      <View style={styles.hudMetricCol}>
                        <Text style={styles.hudMetricValue}>
                          1 / {activeExercise.sets || 2}
                        </Text>
                        <Text style={styles.hudMetricLabel}>SET</Text>
                      </View>

                      <View style={styles.hudDivider} />

                      {/* REPS Metric */}
                      <View style={styles.hudMetricCol}>
                        <View style={styles.repCountWrap}>
                          <AnimatedRepPop
                            repCount={repCount}
                            surface="dark"
                            textStyle={styles.hudRepText}
                            label=""
                          />
                          <Text style={styles.hudDenom}>
                            / {(activeExercise.sets || 2) * (activeExercise.reps || 8)}
                          </Text>
                        </View>
                        <Text style={styles.hudMetricLabel}>REPS</Text>
                      </View>

                      <View style={styles.hudDivider} />

                      {/* FORM Metric */}
                      <View style={styles.hudMetricCol}>
                        <Text style={styles.hudMetricValue}>
                          {formScore}%
                        </Text>
                        <Text style={styles.hudMetricLabel}>FORM</Text>
                      </View>
                    </View>

                    <View style={styles.actionButtonsCol}>
                      <ScalePressable
                        activeScale={0.97}
                        onPress={handleSimulateRep}
                        style={styles.simulateBtn}
                      >
                        <Text style={styles.simulateBtnText}>[ SIMULATE REP ]</Text>
                      </ScalePressable>
                      
                      <View style={styles.bottomActionsRow}>
                        <ScalePressable
                          activeScale={0.97}
                          style={styles.pauseBtn}
                        >
                          <Feather name="pause" size={20} color="#000000" />
                        </ScalePressable>

                        <ScalePressable
                          activeScale={0.97}
                          onPress={handleEndSession}
                          style={styles.nextBtn}
                        >
                          <Text style={styles.nextBtnText}>NEXT EXERCISE →</Text>
                        </ScalePressable>
                      </View>
                    </View>
                  </View>
                </CardSpringEntry>
              ) : null}

              {/* Active Cardio / Non-Strength Tracker HUD */}
              {isSessionActive && (!workout.exercises || workout.exercises.length === 0) && workout.activity !== 'rest' ? (
                <CardSpringEntry index={1}>
                  <View style={styles.activeCardioCard} accessible={true} accessibilityRole="alert">
                    <View style={styles.activeHeaderRow}>
                      <Text style={styles.activeCardioTitle}>{workout.title.toUpperCase()}</Text>
                      <View style={styles.liveIndicator}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>RECORDING</Text>
                      </View>
                    </View>

                    <View style={styles.cardioMetricsDisplay}>
                      <Text style={styles.cardioTimeLarge}>
                        {workout.durationMinutes || 20}:00
                      </Text>
                      <Text style={styles.cardioTimeSub}>PLANNED TIME REMAINING</Text>
                    </View>

                    {workout.distanceKm ? (
                      <View style={styles.cardioDistanceRow}>
                        <Feather name="map-pin" size={16} color="#00C8FF" style={{ marginRight: 6 }} />
                        <Text style={styles.cardioDistanceText}>Target Distance: {workout.distanceKm} km</Text>
                      </View>
                    ) : null}

                    <ScalePressable
                      activeScale={0.97}
                      onPress={handleEndSession}
                      style={styles.completeCardioBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Complete session"
                    >
                      <Text style={styles.completeCardioBtnText}>COMPLETE SESSION</Text>
                    </ScalePressable>
                  </View>
                </CardSpringEntry>
              ) : null}

              {/* Activity-Specific Structure: Running */}
              {workout.activity === 'running' ? (
                <CardSpringEntry index={1}>
                  <WorkoutMeta
                    durationMinutes={workout.durationMinutes}
                    distanceKm={workout.distanceKm}
                    intervalCount={workout.intervalCount}
                    workInterval={workout.workInterval}
                    recoveryInterval={workout.recoveryInterval}
                    equipment={workout.equipment}
                  />

                  <View style={styles.activityProtocolCard} accessible={true} accessibilityRole="summary" accessibilityLabel="Running session protocol">
                    <View style={styles.activityHeaderRow}>
                      <View style={styles.activityIconBox}>
                        <MaterialCommunityIcons name="run" size={20} color="#7C3AED" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.activityProtocolTitle}>RUN-WALK SESSION PROTOCOL</Text>
                        <Text style={styles.activityProtocolSubtitle}>Aerobic conditioning & cadence intervals</Text>
                      </View>
                    </View>

                    <View style={styles.activityMetricsGrid}>
                      <View style={styles.activityMetricItem}>
                        <Text style={styles.activityMetricNum}>{workout.distanceKm || 2.0} km</Text>
                        <Text style={styles.activityMetricLabel}>DISTANCE</Text>
                      </View>
                      <View style={styles.activityMetricItem}>
                        <Text style={styles.activityMetricNum}>{workout.durationMinutes || 20} min</Text>
                        <Text style={styles.activityMetricLabel}>DURATION</Text>
                      </View>
                      <View style={styles.activityMetricItem}>
                        <Text style={styles.activityMetricNum}>{(workout.intensity || 'moderate').toUpperCase()}</Text>
                        <Text style={styles.activityMetricLabel}>INTENSITY</Text>
                      </View>
                    </View>

                    <View style={styles.intervalBox}>
                      <View style={styles.intervalRow}>
                        <Feather name="zap" size={14} color="#D97706" style={{ marginRight: 6 }} />
                        <Text style={styles.intervalLabel}>Structure: {workout.intervalCount || 6} Alternating Intervals</Text>
                      </View>
                      <View style={styles.intervalPillRow}>
                        <View style={styles.intervalWorkPill}>
                          <Text style={styles.intervalPillLabel}>WORK</Text>
                          <Text style={styles.intervalPillValue}>{workout.workInterval || '60 sec run / brisk march'}</Text>
                        </View>
                        <View style={styles.intervalRecPill}>
                          <Text style={styles.intervalPillLabel}>RECOVERY</Text>
                          <Text style={styles.intervalPillValue}>{workout.recoveryInterval || '90 sec walk recovery'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </CardSpringEntry>
              ) : null}

              {/* Activity-Specific Structure: Cycling */}
              {workout.activity === 'cycling' ? (
                <CardSpringEntry index={1}>
                  <WorkoutMeta
                    durationMinutes={workout.durationMinutes}
                    distanceKm={workout.distanceKm}
                    equipment={workout.equipment}
                  />

                  <View style={styles.activityProtocolCard} accessible={true} accessibilityRole="summary" accessibilityLabel="Cycling session protocol">
                    <View style={styles.activityHeaderRow}>
                      <View style={[styles.activityIconBox, { backgroundColor: '#DCFCE7' }]}>
                        <MaterialCommunityIcons name="bike" size={20} color="#059669" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.activityProtocolTitle}>CYCLING ENDURANCE PROTOCOL</Text>
                        <Text style={styles.activityProtocolSubtitle}>Steady-state aerobic base conditioning</Text>
                      </View>
                    </View>

                    <View style={styles.activityMetricsGrid}>
                      <View style={styles.activityMetricItem}>
                        <Text style={styles.activityMetricNum}>{workout.distanceKm || 8.0} km</Text>
                        <Text style={styles.activityMetricLabel}>DISTANCE</Text>
                      </View>
                      <View style={styles.activityMetricItem}>
                        <Text style={styles.activityMetricNum}>{workout.durationMinutes || 30} min</Text>
                        <Text style={styles.activityMetricLabel}>DURATION</Text>
                      </View>
                      <View style={styles.activityMetricItem}>
                        <Text style={styles.activityMetricNum}>{(workout.intensity || 'zone2').toUpperCase()}</Text>
                        <Text style={styles.activityMetricLabel}>INTENSITY</Text>
                      </View>
                    </View>
                  </View>
                </CardSpringEntry>
              ) : null}

              {/* Activity-Specific Structure: Walking */}
              {workout.activity === 'walking' ? (
                <CardSpringEntry index={1}>
                  <WorkoutMeta
                    durationMinutes={workout.durationMinutes}
                    distanceKm={workout.distanceKm}
                  />

                  <View style={styles.activityProtocolCard} accessible={true} accessibilityRole="summary" accessibilityLabel="Walking session protocol">
                    <View style={styles.activityHeaderRow}>
                      <View style={[styles.activityIconBox, { backgroundColor: '#EFF6FF' }]}>
                        <MaterialCommunityIcons name="walk" size={20} color="#2563EB" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.activityProtocolTitle}>WALKING SESSION PROTOCOL</Text>
                        <Text style={styles.activityProtocolSubtitle}>Continuous brisk aerobic movement</Text>
                      </View>
                    </View>

                    <View style={styles.activityMetricsGrid}>
                      <View style={styles.activityMetricItem}>
                        <Text style={styles.activityMetricNum}>{workout.durationMinutes || 30} min</Text>
                        <Text style={styles.activityMetricLabel}>DURATION</Text>
                      </View>
                      {workout.distanceKm ? (
                        <View style={styles.activityMetricItem}>
                          <Text style={styles.activityMetricNum}>{workout.distanceKm} km</Text>
                          <Text style={styles.activityMetricLabel}>DISTANCE</Text>
                        </View>
                      ) : null}
                      <View style={styles.activityMetricItem}>
                        <Text style={styles.activityMetricNum}>{(workout.intensity || 'easy').toUpperCase()}</Text>
                        <Text style={styles.activityMetricLabel}>INTENSITY</Text>
                      </View>
                    </View>
                  </View>
                </CardSpringEntry>
              ) : null}

              {/* Activity-Specific Structure: Swimming */}
              {workout.activity === 'swimming' ? (
                <CardSpringEntry index={1}>
                  <WorkoutMeta
                    durationMinutes={workout.durationMinutes}
                    distanceKm={workout.distanceKm}
                  />

                  <View style={styles.activityProtocolCard} accessible={true} accessibilityRole="summary" accessibilityLabel="Swimming session protocol">
                    <View style={styles.activityHeaderRow}>
                      <View style={[styles.activityIconBox, { backgroundColor: '#E0F2FE' }]}>
                        <MaterialCommunityIcons name="swim" size={20} color="#0284C7" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.activityProtocolTitle}>SWIMMING SESSION PROTOCOL</Text>
                        <Text style={styles.activityProtocolSubtitle}>Low-impact cardiovascular conditioning</Text>
                      </View>
                    </View>

                    <View style={styles.activityMetricsGrid}>
                      <View style={styles.activityMetricItem}>
                        <Text style={styles.activityMetricNum}>{workout.durationMinutes || 30} min</Text>
                        <Text style={styles.activityMetricLabel}>DURATION</Text>
                      </View>
                      {workout.distanceKm ? (
                        <View style={styles.activityMetricItem}>
                          <Text style={styles.activityMetricNum}>{workout.distanceKm} km</Text>
                          <Text style={styles.activityMetricLabel}>DISTANCE</Text>
                        </View>
                      ) : null}
                      <View style={styles.activityMetricItem}>
                        <Text style={styles.activityMetricNum}>{(workout.intensity || 'moderate').toUpperCase()}</Text>
                        <Text style={styles.activityMetricLabel}>INTENSITY</Text>
                      </View>
                    </View>
                  </View>
                </CardSpringEntry>
              ) : null}

              {/* Activity-Specific Structure: Rest Day */}
              {workout.activity === 'rest' ? (
                <CardSpringEntry index={1}>
                  <View style={styles.restDayCard} accessible={true} accessibilityRole="summary" accessibilityLabel="Rest and recovery protocol">
                    <View style={styles.restHeaderRow}>
                      <View style={styles.restIconBox}>
                        <Feather name="heart" size={22} color="#DC2626" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.restCardTitle}>ACTIVE RECOVERY & REPLENISHMENT</Text>
                        <Text style={styles.restCardSubtitle}>Essential muscle adaptation & CNS rest</Text>
                      </View>
                    </View>

                    <Text style={styles.restInstructions}>
                      {workout.workoutInstructions || 'Rest today and allow your muscular and nervous systems to adapt. Meeting your nutrition targets and prioritizing restful sleep prepares your body for upcoming training sessions.'}
                    </Text>

                    <View style={styles.recoveryPillGrid}>
                      <View style={styles.recoveryPillItem}>
                        <Feather name="droplet" size={14} color="#2563EB" style={{ marginRight: 6 }} />
                        <Text style={styles.recoveryPillText}>2.5–3.5 L Water</Text>
                      </View>
                      <View style={styles.recoveryPillItem}>
                        <Feather name="moon" size={14} color="#7C3AED" style={{ marginRight: 6 }} />
                        <Text style={styles.recoveryPillText}>8 Hours Sleep</Text>
                      </View>
                      <View style={styles.recoveryPillItem}>
                        <MaterialCommunityIcons name="silverware-fork-knife" size={14} color="#059669" style={{ marginRight: 6 }} />
                        <Text style={styles.recoveryPillText}>Protein Target</Text>
                      </View>
                    </View>
                  </View>
                </CardSpringEntry>
              ) : null}

              {/* Prescribed Exercise List (Only rendered when exercises exist - Strength days) */}
              <CardSpringEntry index={2}>
                <ExerciseList
                  exercises={workout.exercises}
                  activeExerciseId={activeExercise?.id}
                  completedExerciseIds={completedExerciseIds}
                  onSelectExercise={handleStartSession}
                />
              </CardSpringEntry>

              {/* Collapsible Session Guidance & Protocols */}
              <CardSpringEntry index={3}>
                {workout.warmUp && workout.warmUp.length > 0 ? (
                  <WarmupSection warmUp={workout.warmUp} durationMinutes={3} />
                ) : null}
                {workout.workoutInstructions && workout.activity !== 'rest' ? (
                  <WorkoutInstructions instructions={workout.workoutInstructions} />
                ) : null}
                {workout.cooldown && workout.cooldown.length > 0 ? (
                  <CooldownSection cooldown={workout.cooldown} durationMinutes={3} />
                ) : null}
                {workout.accessibilityGuidance ? (
                  <AccessibilityGuidance guidance={workout.accessibilityGuidance} />
                ) : null}
              </CardSpringEntry>
            </>
          ) : null}
        </AsyncStateView>
      </ScrollView>

      {/* Completion Modal Animation */}
      <WorkoutCompleteBadge
        visible={showCompleteModal}
        exerciseName={activeExercise?.name || workout?.title || 'Workout'}
        reps={repCount}
        formScore={formScore}
        onClose={() => setShowCompleteModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm + 4,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h2,
    fontSize: 18,
    color: Colors.dark,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
  },
  activeCoachCard: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: Layout.spacing.lg,
    ...Layout.shadows.card,
  },
  activeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.sm,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: 6,
  },
  liveText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  targetBadge: {
    backgroundColor: Colors.surface,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  targetBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  activeExerciseTitle: {
    ...Typography.h2,
    fontSize: 20,
    color: Colors.text,
    marginTop: 2,
  },
  activeExercisePlan: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: Layout.spacing.md,
  },
  hudMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#001554',
    borderRadius: Layout.borderRadius.xl,
    paddingVertical: Layout.spacing.lg,
    paddingHorizontal: Layout.spacing.sm,
    marginBottom: Layout.spacing.md,
    borderWidth: 1,
    borderColor: '#07328D',
  },
  hudMetricCol: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  hudDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#07328D',
  },
  hudRingCol: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Layout.spacing.md,
  },
  repCountWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  hudRepText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  hudDenom: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  hudMetricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  hudMetricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00C8FF',
    letterSpacing: 1,
    marginTop: 4,
  },
  actionButtonsCol: {
    marginTop: Layout.spacing.xl,
  },
  simulateBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: Layout.spacing.lg,
  },
  simulateBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#A1A1AA',
    letterSpacing: 2,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  pauseBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: {
    flex: 1,
    height: 56,
    backgroundColor: '#000000',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  activityProtocolCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Layout.spacing.md,
    ...Layout.shadows.subtle,
  },
  activityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  activityIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
  },
  activityProtocolTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#040E34',
    letterSpacing: 0.5,
  },
  activityProtocolSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  activityMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  activityMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  activityMetricNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#040E34',
  },
  activityMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  intervalBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  intervalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  intervalPillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  intervalWorkPill: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: Layout.borderRadius.md,
  },
  intervalRecPill: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: Layout.borderRadius.md,
  },
  intervalPillLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#78350F',
    letterSpacing: 0.5,
  },
  intervalPillValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
  },
  restDayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: '#FECDD3',
    marginBottom: Layout.spacing.md,
    ...Layout.shadows.subtle,
  },
  restHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  restIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
  },
  restCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9F1239',
    letterSpacing: 0.5,
  },
  restCardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  restInstructions: {
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
    marginBottom: Layout.spacing.md,
  },
  recoveryPillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recoveryPillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Layout.borderRadius.full,
  },
  recoveryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  activeCardioCard: {
    backgroundColor: '#001554',
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: '#07328D',
    marginBottom: Layout.spacing.md,
  },
  activeCardioTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cardioMetricsDisplay: {
    alignItems: 'center',
    marginVertical: Layout.spacing.lg,
  },
  cardioTimeLarge: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  cardioTimeSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00C8FF',
    letterSpacing: 1,
    marginTop: 4,
  },
  cardioDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.md,
  },
  cardioDistanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  completeCardioBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: Layout.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Layout.spacing.sm,
  },
  completeCardioBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});


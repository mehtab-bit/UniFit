import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
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
      const today = await workoutService.getTodayWorkout();
      setWorkout(today);
      if (today.exercises && today.exercises.length > 0) {
        setActiveExercise(today.exercises[0]);
      }
    } catch (err) {
      setError('Unable to load workout program. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

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
                  exercisesCount={workout.exercises?.length || 5}
                  distanceKm={workout.distanceKm}
                  equipment={workout.equipment}
                  onStartWorkout={() => {
                    const nextEx = workout.exercises?.find((e) => !completedExerciseIds.includes(e.id)) || workout.exercises?.[0];
                    if (nextEx) handleStartSession(nextEx);
                  }}
                  isSessionActive={isSessionActive}
                  completedExercisesCount={completedExerciseIds.length}
                />
              </CardSpringEntry>

              {/* Active Exercise Guidance & Motion HUD */}
              {isSessionActive && activeExercise ? (
                <CardSpringEntry index={1}>
                  <View
                    style={styles.activeCoachCard}
                    accessible={true}
                    accessibilityRole="alert"
                    accessibilityLiveRegion="assertive"
                    accessibilityLabel={`Active exercise: ${activeExercise.name}. Repetitions counted: ${repCount}. Form score: ${formScore} percent. Latest guidance: ${lastFeedback}`}
                  >
                    <View style={styles.activeHeaderRow}>
                      <View style={styles.liveIndicator}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>LIVE MOTION ANALYSIS</Text>
                      </View>
                      <View style={styles.targetBadge}>
                        <Text style={styles.targetBadgeText}>{activeExercise.target}</Text>
                      </View>
                    </View>

                    <Text style={styles.activeExerciseTitle}>{activeExercise.name.toUpperCase()}</Text>
                    <Text style={styles.activeExercisePlan}>
                      Prescription: {activeExercise.sets} sets × {activeExercise.reps} reps • Rest {activeExercise.restSeconds || 70}s
                    </Text>

                    {/* Prominent Visual Progress Grid (REPS, FORM RING, SET) */}
                    <View style={styles.hudMetricsRow}>
                      {/* Reps with animated pop */}
                      <View style={styles.hudMetricCol}>
                        <View style={styles.repCountWrap}>
                          <AnimatedRepPop repCount={repCount} label="" />
                          <Text style={styles.hudDenom}>
                            / {(activeExercise.sets || 2) * (activeExercise.reps || 8)}
                          </Text>
                        </View>
                        <Text style={styles.hudMetricLabel}>REPS</Text>
                      </View>

                      {/* Form Score Animated Ring */}
                      <View style={styles.hudRingCol}>
                        <AnimatedProgressRing
                          progress={formScore}
                          size={70}
                          strokeWidth={6}
                          color="#00C8FF"
                          backgroundColor="#07328D"
                          label="FORM"
                          accessibilityLabel={`Form score ${formScore} percent`}
                        />
                      </View>

                      {/* Current Set */}
                      <View style={styles.hudMetricCol}>
                        <Text style={styles.hudSetText}>
                          {Math.min(activeExercise.sets || 2, Math.floor(repCount / (activeExercise.reps || 8)) + 1)}
                          <Text style={styles.hudDenom}> / {activeExercise.sets || 2}</Text>
                        </Text>
                        <Text style={styles.hudMetricLabel}>SET</Text>
                      </View>
                    </View>

                    {/* Active Exercise Form Cues Checklist */}
                    {activeExercise.formCues && activeExercise.formCues.length > 0 ? (
                      <FormCues cues={activeExercise.formCues} title="MOVEMENT CUES" />
                    ) : null}

                    {/* Live Slide-In Guidance Banner */}
                    <View style={{ marginTop: Layout.spacing.sm }}>
                      <SlideInBanner
                        message={lastFeedback}
                        type={bannerType}
                        accessibilityLiveRegion="polite"
                      />
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtonsCol}>
                      <PrimaryButton
                        title="Simulate Next Rep"
                        onPress={handleSimulateRep}
                        accessibilityLabel="Count repetition and update form score"
                        accessibilityHint="Simulates movement rep detection and audio-haptic feedback"
                      />
                      <View style={{ height: 10 }} />
                      <ScalePressable
                        activeScale={0.97}
                        onPress={handleEndSession}
                        accessibilityRole="button"
                        accessibilityLabel="Complete Exercise Set"
                        accessibilityHint="Finishes active set and logs adherence"
                        style={styles.endButton}
                      >
                        <Feather name="check-circle" size={18} color={Colors.textInverse} style={{ marginRight: 8 }} />
                        <Text style={styles.endButtonText}>Complete Exercise Set</Text>
                      </ScalePressable>
                    </View>
                  </View>
                </CardSpringEntry>
              ) : null}

              {/* Prescribed Exercise List (Sleek rows, differentiated states) */}
              <CardSpringEntry index={2}>
                <ExerciseList
                  exercises={workout.exercises}
                  activeExerciseId={activeExercise?.id}
                  completedExerciseIds={completedExerciseIds}
                  onSelectExercise={handleStartSession}
                />
              </CardSpringEntry>

              {/* Collapsible Session Guidance & Protocols (Progressive Disclosure) */}
              <CardSpringEntry index={3}>
                <WarmupSection warmUp={workout.warmUp} durationMinutes={3} />
                <WorkoutInstructions instructions={workout.workoutInstructions} />
                <CooldownSection cooldown={workout.cooldown} durationMinutes={3} />
                <AccessibilityGuidance guidance={workout.accessibilityGuidance} />
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
    paddingVertical: Layout.spacing.md,
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
  hudRingCol: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  repCountWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  hudDenom: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9E9FA9',
    marginLeft: 2,
  },
  hudSetText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  hudMetricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00C8FF',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  actionButtonsCol: {
    marginTop: Layout.spacing.md,
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark,
    borderRadius: Layout.borderRadius.lg,
    paddingVertical: Layout.spacing.md,
    minHeight: 46,
  },
  endButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.textInverse,
    fontSize: 14,
  },
});

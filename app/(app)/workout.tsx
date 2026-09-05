import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useScreenAnnouncement } from '../../hooks/useScreenAnnouncement';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { ScalePressable } from '../../components/animations/ScalePressable';
import { CardSpringEntry } from '../../components/animations/CardSpringEntry';
import { AsyncStateView } from '../../components/common/AsyncStateView';
import { WorkoutCompleteBadge } from '../../components/animations/WorkoutCompleteBadge';
import { WorkoutHeader } from '../../components/workout/WorkoutHeader';
import { WorkoutMeta } from '../../components/workout/WorkoutMeta';
import { WarmupSection } from '../../components/workout/WarmupSection';
import { WorkoutInstructions } from '../../components/workout/WorkoutInstructions';
import { ExerciseList } from '../../components/workout/ExerciseList';
import { CooldownSection } from '../../components/workout/CooldownSection';
import { AccessibilityGuidance } from '../../components/workout/AccessibilityGuidance';
import { ManualSessionCard } from '../../components/workout/ManualSessionCard';
import { workoutService } from '../../services';
import { operationIdFromParts } from '../../utils/operationId';
import {
  Exercise,
  StrengthFamily,
  WorkoutCompletionPayload,
  WorkoutDay
} from '../../types/domain';
import {
  ManualSessionRequest,
  subscribeToCvSession,
  subscribeToManualSession
} from '../../src/cv/sessionEvents';

const LIVE_FAMILIES: StrengthFamily[] = ['squat', 'lunge', 'pushup', 'bicep_curl', 'supported_row'];

function localISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function familySlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function manualExerciseFromRequest(request: ManualSessionRequest): Exercise {
  return {
    id: request.exerciseId,
    name: request.name,
    target: 'Manual counting',
    family: request.family as StrengthFamily | undefined,
    repMode: request.repMode,
    sets: request.sets,
    reps: request.reps,
    restSeconds: request.restSeconds
  };
}

function metricText(value: number | undefined, suffix: string): string {
  return value == null ? '—' : `${value} ${suffix}`;
}

export default function WorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; dayId?: string }>();
  useScreenAnnouncement(
    'Exercise Coach screen. Choose an exercise to use the camera coach, or count reps manually.'
  );

  const { provideFeedback } = useAccessibility();
  const { user } = useAuth();

  const [workout, setWorkout] = useState<WorkoutDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [manualExercise, setManualExercise] = useState<Exercise | null>(null);
  const [completedExerciseIds, setCompletedExerciseIds] = useState<string[]>([]);
  const [repCount, setRepCount] = useState(0);
  const [cameraScore, setCameraScore] = useState<number | null>(null);
  const [badgeSource, setBadgeSource] = useState<
    'camera' | 'manual' | 'activity'
  >('camera');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const cvSessionNonceRef = useRef(0);
  const manualProgressRef = useRef({ done: 0, target: 0 });

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
        targetWorkout = await workoutService.getTodayWorkout(user?.id);
      }
      setWorkout(targetWorkout);
      if (targetWorkout.exercises && targetWorkout.exercises.length > 0) {
        setActiveExercise(targetWorkout.exercises[0]);
      } else {
        setActiveExercise(null);
      }
    } catch (err: any) {
      const detail =
        err?.message && typeof err.message === 'string'
          ? err.message
          : 'Unable to load workout program. Please try again.';
      console.warn('Workout load failed:', err);
      setError(detail);
    } finally {
      setLoading(false);
    }
  }, [params.date, params.dayId, user?.id]);

  useEffect(() => {
    void loadWorkoutData();
  }, [loadWorkoutData]);

  const logFamilyCompletion = useCallback(
    async (
      exercise: Exercise,
      repsCompleted: number,
      completionPct: number,
      source: 'camera' | 'manual'
    ) => {
      const family = exercise.family ?? familySlug(exercise.name);
      const payload: WorkoutCompletionPayload = {
        user_id: user?.id || 'user_default',
        operation_id: operationIdFromParts(
          user?.id,
          workout?.id,
          exercise.id,
          family
        ),
        scheduled_workout_id: workout?.id,
        local_date: workout?.date || localISODate(),
        activity_id: workout?.activity_id || workout?.activity || 'strength',
        requested_activity_id:
          workout?.activity_id || workout?.activity || 'strength',
        progression_key:
          workout?.progression_key || workout?.activity || 'strength',
        session_type: workout?.session_type,
        completion_pct: Math.max(0, Math.min(100, completionPct)),
        exercise_completion_pct: {
          [family]: Math.max(0, Math.min(100, completionPct))
        },
        source,
        reps_completed: repsCompleted
      };
      await workoutService.logWorkoutCompletion(
        payload,
        25,
        repsCompleted,
        user?.id
      );
      setCompletedExerciseIds((previous) =>
        Array.from(new Set([...previous, exercise.id]))
      );
    },
    [user?.id, workout]
  );

  // Camera sessions finalize in cv-session and emit their result here.
  useEffect(
    () =>
      subscribeToCvSession((result) => {
        const matched = workout?.exercises?.find(
          (exercise) => exercise.id === result.exerciseId
        );
        setActiveExercise(matched ?? null);
        setManualExercise(null);
        setRepCount((current) => Math.max(current, result.reps));
        setCameraScore(result.score);
        setBadgeSource('camera');
        setShowCompleteModal(true);
        if (matched) {
          // cv-session already logs the camera completion; only reflect the
          // result in this screen's state so sessions are never double-logged.
          setCompletedExerciseIds((previous) =>
            Array.from(new Set([...previous, matched.id]))
          );
        }
      }),
    [workout]
  );

  // Manual fallback requested from a camera session (denied/failed camera).
  useEffect(
    () =>
      subscribeToManualSession((request) => {
        const exercise = manualExerciseFromRequest(request);
        setManualExercise(exercise);
        setActiveExercise(exercise);
        setRepCount(0);
        manualProgressRef.current = { done: 0, target: 0 };
        provideFeedback({
          text: `${exercise.name} manual counting started. Tap Count a Rep for each repetition.`,
          priority: 'high',
          haptic: 'success'
        });
      }),
    [provideFeedback]
  );

  const startManualSession = useCallback(
    (exercise: Exercise) => {
      setActiveExercise(exercise);
      setRepCount(0);
      setCameraScore(null);
      setManualExercise(exercise);
      manualProgressRef.current = { done: 0, target: 0 };
      provideFeedback({
        text: `${exercise.name} manual session started. Tap Count a Rep for each repetition.`,
        priority: 'high',
        haptic: 'success'
      });
    },
    [provideFeedback]
  );

  const handleStartSession = useCallback(
    (exercise: Exercise) => {
      const isLive = Boolean(
        exercise.family && LIVE_FAMILIES.includes(exercise.family)
      );

      if (isLive) {
        setActiveExercise(exercise);
        setRepCount(0);
        setCameraScore(null);
        setManualExercise(null);
        cvSessionNonceRef.current += 1;
        router.push({
          pathname: '/(app)/cv-session',
          params: {
            exerciseId: exercise.id,
            family: exercise.family,
            name: exercise.name,
            nonce: String(cvSessionNonceRef.current),
            sets: String(exercise.sets || 2),
            reps: String(exercise.reps || 8),
            restSeconds: String(exercise.restSeconds || 70),
            repMode: exercise.repMode || '',
            activityId:
              workout?.activity_id || workout?.activity || 'strength',
            progressionKey:
              workout?.progression_key || workout?.activity || 'strength',
            sessionType: workout?.session_type,
            scheduledWorkoutId: workout?.id,
            date: workout?.date
          }
        });
        return;
      }

      startManualSession(exercise);
    },
    [router, startManualSession, workout]
  );

  const logActivityCompletion = useCallback(async () => {
    if (!workout) return;
    const duration = workout.durationMinutes ?? 25;
    const payload: WorkoutCompletionPayload = {
      user_id: user?.id || 'user_default',
      operation_id: operationIdFromParts(user?.id, workout.id, 'activity'),
      scheduled_workout_id: workout.id,
      local_date: workout.date || localISODate(),
      activity_id: workout.activity_id || workout.activity || 'strength',
      requested_activity_id:
        workout.activity_id || workout.activity || 'strength',
      progression_key:
        workout.progression_key || workout.activity || 'strength',
      session_type: workout.session_type,
      completion_pct: 100,
      source: 'activity',
      reps_completed: 0
    };
    await workoutService.logWorkoutCompletion(
      payload,
      duration,
      0,
      user?.id
    );
    setRepCount(duration);
    setCameraScore(null);
    setBadgeSource('activity');
    setShowCompleteModal(true);
    provideFeedback({
      text: `${workout.title} recorded as complete.`,
      priority: 'high',
      haptic: 'success'
    });
  }, [user?.id, workout, provideFeedback]);

  const handleStartWorkout = useCallback(() => {
    const nextExercise =
      workout?.exercises?.find(
        (exercise) => !completedExerciseIds.includes(exercise.id)
      ) || workout?.exercises?.[0];

    if (!nextExercise) {
      if (!workout || workout.activity === 'rest') {
        return;
      }
      // Cardio/interval days have no camera-tracked reps, so the demo flow
      // records the prescribed session as completed from this screen.
      Alert.alert(
        'Start activity?',
        `Record ${workout.title} as a completed ${workout.durationMinutes ?? 25}-minute session?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Record session',
            onPress: () => void logActivityCompletion()
          }
        ]
      );
      return;
    }
    handleStartSession(nextExercise);
  }, [completedExerciseIds, handleStartSession, logActivityCompletion, workout]);

  const handleManualComplete = useCallback(
    async (result: { reps: number }) => {
      if (!manualExercise) return;
      const exercise = manualExercise;
      setManualExercise(null);
      setRepCount(result.reps);
      setCameraScore(null);
      setBadgeSource('manual');
      setShowCompleteModal(true);
      await logFamilyCompletion(exercise, result.reps, 100, 'manual');
    },
    [logFamilyCompletion, manualExercise]
  );

  const saveManualPartial = useCallback(
    async (exercise: Exercise, done: number, target: number) => {
      if (done <= 0) return;
      const fraction = Math.round((done / Math.max(1, target)) * 100);
      setManualExercise(null);
      setRepCount(done);
      setCameraScore(null);
      setBadgeSource('manual');
      setShowCompleteModal(true);
      await logFamilyCompletion(exercise, done, fraction, 'manual');
    },
    [logFamilyCompletion]
  );

  const handleManualEndRequest = useCallback(() => {
    const exercise = manualExercise;
    if (!exercise) return;
    const { done, target } = manualProgressRef.current;

    if (done === 0) {
      Alert.alert('End session?', 'No reps have been counted yet.', [
        { text: 'Keep going', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: () => setManualExercise(null)
        }
      ]);
      return;
    }

    Alert.alert(
      'Save your progress?',
      `You've counted ${done} of ${target} reps manually. Save it as a partial session?`,
      [
        {
          text: 'Save & end',
          onPress: () => void saveManualPartial(exercise, done, target)
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => setManualExercise(null)
        },
        { text: 'Keep going', style: 'cancel' }
      ]
    );
  }, [manualExercise, saveManualPartial]);

  const handleManualProgress = useCallback((done: number, target: number) => {
    manualProgressRef.current = { done, target };
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor={Colors.background} />

      <View style={styles.header} accessible={true} accessibilityRole="header">
        <ScalePressable
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/(app)')
          }
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
                  onStartWorkout={handleStartWorkout}
                  completedExercisesCount={completedExerciseIds.length}
                />
              </CardSpringEntry>

              {manualExercise ? (
                <CardSpringEntry index={1}>
                  <ManualSessionCard
                    exercise={manualExercise}
                    onProgress={handleManualProgress}
                    onComplete={handleManualComplete}
                    onEndRequest={handleManualEndRequest}
                  />
                </CardSpringEntry>
              ) : null}

              {/* Activity-Specific Protocol Reference: Running */}
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
                        <Text style={styles.activityMetricNum}>
                          {metricText(workout.distanceKm, 'km')}
                        </Text>
                        <Text style={styles.activityMetricLabel}>DISTANCE</Text>
                      </View>
                      <View style={styles.activityMetricItem}>
                        <Text style={styles.activityMetricNum}>
                          {metricText(workout.durationMinutes, 'min')}
                        </Text>
                        <Text style={styles.activityMetricLabel}>DURATION</Text>
                      </View>
                      <View style={styles.activityMetricItem}>
                        <Text style={styles.activityMetricNum}>
                          {workout.intensity ? workout.intensity.toUpperCase() : '—'}
                        </Text>
                        <Text style={styles.activityMetricLabel}>INTENSITY</Text>
                      </View>
                    </View>

                    <View style={styles.intervalBox}>
                      <View style={styles.intervalRow}>
                        <Feather name="zap" size={14} color="#D97706" style={{ marginRight: 6 }} />
                        <Text style={styles.intervalLabel}>
                          Structure: {workout.intervalCount ?? '—'} Alternating Intervals
                        </Text>
                      </View>
                      <View style={styles.intervalPillRow}>
                        <View style={styles.intervalWorkPill}>
                          <Text style={styles.intervalPillLabel}>WORK</Text>
                          <Text style={styles.intervalPillValue}>{workout.workInterval ?? '—'}</Text>
                        </View>
                        <View style={styles.intervalRecPill}>
                          <Text style={styles.intervalPillLabel}>RECOVERY</Text>
                          <Text style={styles.intervalPillValue}>{workout.recoveryInterval ?? '—'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </CardSpringEntry>
              ) : null}

              {/* Activity-Specific Protocol Reference: Cycling */}
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
                        <Text style={styles.activityMetricNum}>
                          {metricText(workout.distanceKm, 'km')}
                        </Text>
                        <Text style={styles.activityMetricLabel}>DISTANCE</Text>
                      </View>
                      <View style={styles.activityMetricItem}>
                        <Text style={styles.activityMetricNum}>
                          {metricText(workout.durationMinutes, 'min')}
                        </Text>
                        <Text style={styles.activityMetricLabel}>DURATION</Text>
                      </View>
                      <View style={styles.activityMetricItem}>
                        <Text style={styles.activityMetricNum}>
                          {workout.intensity ? workout.intensity.toUpperCase() : '—'}
                        </Text>
                        <Text style={styles.activityMetricLabel}>INTENSITY</Text>
                      </View>
                    </View>
                  </View>
                </CardSpringEntry>
              ) : null}

              {/* Activity-Specific Protocol Reference: Walking */}
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
                        <Text style={styles.activityMetricNum}>
                          {metricText(workout.durationMinutes, 'min')}
                        </Text>
                        <Text style={styles.activityMetricLabel}>DURATION</Text>
                      </View>
                      {workout.distanceKm ? (
                        <View style={styles.activityMetricItem}>
                          <Text style={styles.activityMetricNum}>
                            {metricText(workout.distanceKm, 'km')}
                          </Text>
                          <Text style={styles.activityMetricLabel}>DISTANCE</Text>
                        </View>
                      ) : null}
                      <View style={styles.activityMetricItem}>
                        <Text style={styles.activityMetricNum}>
                          {workout.intensity ? workout.intensity.toUpperCase() : '—'}
                        </Text>
                        <Text style={styles.activityMetricLabel}>INTENSITY</Text>
                      </View>
                    </View>
                  </View>
                </CardSpringEntry>
              ) : null}

              {/* Activity-Specific Protocol Reference: Swimming */}
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
                        <Text style={styles.activityMetricNum}>
                          {metricText(workout.durationMinutes, 'min')}
                        </Text>
                        <Text style={styles.activityMetricLabel}>DURATION</Text>
                      </View>
                      {workout.distanceKm ? (
                        <View style={styles.activityMetricItem}>
                          <Text style={styles.activityMetricNum}>
                            {metricText(workout.distanceKm, 'km')}
                          </Text>
                          <Text style={styles.activityMetricLabel}>DISTANCE</Text>
                        </View>
                      ) : null}
                      <View style={styles.activityMetricItem}>
                        <Text style={styles.activityMetricNum}>
                          {workout.intensity ? workout.intensity.toUpperCase() : '—'}
                        </Text>
                        <Text style={styles.activityMetricLabel}>INTENSITY</Text>
                      </View>
                    </View>
                  </View>
                </CardSpringEntry>
              ) : null}

              {/* Activity-Specific Protocol Reference: Rest Day */}
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

              <CardSpringEntry index={2}>
                <ExerciseList
                  exercises={workout.exercises}
                  activeExerciseId={activeExercise?.id}
                  completedExerciseIds={completedExerciseIds}
                  onSelectExercise={handleStartSession}
                />
              </CardSpringEntry>

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

      <WorkoutCompleteBadge
        visible={showCompleteModal}
        exerciseName={activeExercise?.name || workout?.title || 'Workout'}
        reps={repCount}
        formScore={badgeSource === 'camera' ? cameraScore : null}
        source={badgeSource}
        onClose={() => setShowCompleteModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm + 4,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    ...Typography.h2,
    fontSize: 18,
    color: Colors.dark,
    fontWeight: '800'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl
  },
  activityProtocolCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Layout.spacing.md,
    ...Layout.shadows.subtle
  },
  activityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.md
  },
  activityIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md
  },
  activityProtocolTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#040E34',
    letterSpacing: 0.5
  },
  activityProtocolSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  activityMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md
  },
  activityMetricItem: {
    alignItems: 'center',
    flex: 1
  },
  activityMetricNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#040E34'
  },
  activityMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 4,
    letterSpacing: 0.5
  },
  intervalBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    borderWidth: 1,
    borderColor: '#FEF3C7'
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm
  },
  intervalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E'
  },
  intervalPillRow: {
    flexDirection: 'row',
    gap: 8
  },
  intervalWorkPill: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: Layout.borderRadius.md
  },
  intervalRecPill: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: Layout.borderRadius.md
  },
  intervalPillLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#78350F',
    letterSpacing: 0.5
  },
  intervalPillValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2
  },
  restDayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    borderWidth: 1,
    borderColor: '#FECDD3',
    marginBottom: Layout.spacing.md,
    ...Layout.shadows.subtle
  },
  restHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.md
  },
  restIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md
  },
  restCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9F1239',
    letterSpacing: 0.5
  },
  restCardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  restInstructions: {
    fontSize: 14,
    lineHeight: 20,
    color: '#334155',
    marginBottom: Layout.spacing.md
  },
  recoveryPillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  recoveryPillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Layout.borderRadius.full
  },
  recoveryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155'
  }
});

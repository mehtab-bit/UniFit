import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useScreenAnnouncement } from '../../hooks/useScreenAnnouncement';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { WorkoutCompleteBadge } from '../../components/animations/WorkoutCompleteBadge';
import { ScalePressable } from '../../components/animations/ScalePressable';
import { CardSpringEntry } from '../../components/animations/CardSpringEntry';
import { AsyncStateView } from '../../components/common/AsyncStateView';
import { WorkoutHeader } from '../../components/workout/WorkoutHeader';
import { WarmupSection } from '../../components/workout/WarmupSection';
import { WorkoutInstructions } from '../../components/workout/WorkoutInstructions';
import { ExerciseList } from '../../components/workout/ExerciseList';
import { CooldownSection } from '../../components/workout/CooldownSection';
import { AccessibilityGuidance } from '../../components/workout/AccessibilityGuidance';
import { ManualSessionCard } from '../../components/workout/ManualSessionCard';
import { workoutService } from '../../services';
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

export default function WorkoutScreen() {
  const router = useRouter();
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
  const [badgeSource, setBadgeSource] = useState<'camera' | 'manual'>('camera');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const cvSessionNonceRef = useRef(0);
  const manualProgressRef = useRef({ done: 0, target: 0 });

  const loadWorkoutData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const today = await workoutService.getTodayWorkout(user?.id);
      setWorkout(today);
      if (today.exercises && today.exercises.length > 0) {
        setActiveExercise(today.exercises[0]);
      }
    } catch {
      setError('Unable to load workout program. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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
        setRepCount((current) => Math.max(current, result.reps));
        setCameraScore(result.score);
        setBadgeSource('camera');
        setShowCompleteModal(true);
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
            sessionType: workout?.session_type
          }
        });
        return;
      }

      startManualSession(exercise);
    },
    [router, startManualSession, workout]
  );

  const handleStartWorkout = useCallback(() => {
    const nextExercise =
      workout?.exercises?.find(
        (exercise) => !completedExerciseIds.includes(exercise.id)
      ) || workout?.exercises?.[0];

    if (!nextExercise) {
      // Cardio/interval days have no exercise list; logging lives on the
      // Activity screen. Never leave the primary CTA dead.
      router.replace('/(app)/activity');
      return;
    }
    handleStartSession(nextExercise);
  }, [completedExerciseIds, handleStartSession, router, workout]);

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

              <CardSpringEntry index={2}>
                <ExerciseList
                  exercises={workout.exercises}
                  activeExerciseId={activeExercise?.id}
                  completedExerciseIds={completedExerciseIds}
                  onSelectExercise={handleStartSession}
                />
              </CardSpringEntry>

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
  }
});

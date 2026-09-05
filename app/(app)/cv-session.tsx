import { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ExerciseId, Side } from '../../src/cv/types';
import { buildSessionPlan } from '../../src/cv/sessionPlan';
import {
  emitCvSessionResult,
  ManualSessionRequest,
  requestManualSession
} from '../../src/cv/sessionEvents';
import { workoutService } from '../../services';
import { operationIdFromParts } from '../../utils/operationId';
import { enqueuePending } from '../../lib/pendingQueue';
import { useAccessibility } from '../../context/AccessibilityContext';
import { WorkoutCompletionPayload } from '../../types/domain';
import { useAuth } from '../../context/AuthContext';
import { trackRenderBurst } from '../../src/cv/debugRenderCount';

const BILATERAL_FAMILIES: ExerciseId[] = ['lunge', 'bicep_curl', 'supported_row'];
let screenMountLogged = false;

// The camera pipeline pulls in TensorFlow.js, which is heavy and never used
// on web/desktop. Lazy-load it only when a CV session actually opens.
const CvDemoScreen = lazy(() =>
  import('../../src/CvDemoScreen').then((module) => ({
    default: module.CvDemoScreen
  }))
);

type SessionProgress = {
  side: Side;
  sideReps: number;
  sideTarget: number;
};

export default function CvSessionScreen() {
  trackRenderBurst('CvSessionScreen');
  if (typeof __DEV__ !== 'undefined' && __DEV__ && !screenMountLogged) {
    console.info('[UniFit-screen] cv-session mounted');
    screenMountLogged = true;
  }
  const router = useRouter();
  const params = useLocalSearchParams<{
    exerciseId?: string;
    family?: string;
    name?: string;
    sets?: string;
    reps?: string;
    restSeconds?: string;
    repMode?: string;
    activityId?: string;
    progressionKey?: string;
    sessionType?: string;
    scheduledWorkoutId?: string;
    date?: string;
    nonce?: string;
  }>();
  const { provideFeedback } = useAccessibility();
  const { user } = useAuth();

  const family = (params.family ?? 'squat') as ExerciseId;
  const sessionKey = params.nonce ?? family;
  const exerciseId = params.exerciseId ?? `ex-${family}`;
  const exerciseName = params.name ?? family;

  const plan = useMemo(
    () =>
      buildSessionPlan({
        family,
        sets: params.sets,
        reps: params.reps,
        repMode: params.repMode
      }),
    [family, params.repMode, params.reps, params.sets]
  );
  const restSeconds = Math.max(0, Math.round(Number(params.restSeconds ?? 70) || 70));
  const isBilateral = plan.bilateral && BILATERAL_FAMILIES.includes(family);

  const [activeSide, setActiveSide] = useState<Side>('right');
  const [completed, setCompleted] = useState(false);
  const activeSideRef = useRef<Side>('right');
  const finishedSidesRef = useRef<Side[]>([]);
  const accumulatedRepsRef = useRef(0);
  const scoreSumRef = useRef(0);
  const scoreCountRef = useRef(0);
  const issueCodesRef = useRef<Set<string>>(new Set());
  const completedRef = useRef(false);
  const progressRef = useRef<SessionProgress>({
    side: 'right',
    sideReps: 0,
    sideTarget: plan.repsPerSide
  });

  const makePayload = useCallback(
    (
      completionPct: number,
      repsCompleted: number,
      source: 'camera' | 'manual',
      rangeScore: number | null = null,
      issueCodes: string[] | null = null
    ): WorkoutCompletionPayload => ({
      user_id: user?.id || 'user_default',
      operation_id: operationIdFromParts(
        user?.id,
        params.scheduledWorkoutId,
        params.date,
        params.exerciseId || family,
        params.nonce || family
      ),
      scheduled_workout_id: params.scheduledWorkoutId,
      local_date: params.date,
      activity_id: params.activityId || 'strength',
      requested_activity_id: params.activityId || 'strength',
      progression_key: params.progressionKey || params.activityId || 'strength',
      session_type: params.sessionType,
      completion_pct: Math.max(0, Math.min(100, completionPct)),
      exercise_completion_pct: {
        [family]: Math.max(0, Math.min(100, completionPct))
      },
      source,
      reps_completed: repsCompleted,
      range_score: rangeScore,
      issue_codes: issueCodes ?? undefined
    }),
    [family, params.activityId, params.progressionKey, params.sessionType, user?.id]
  );

  const logCompletion = useCallback(
    async (payload: WorkoutCompletionPayload, repsCompleted: number) => {
      try {
        await workoutService.logWorkoutCompletion(
          payload,
          25,
          repsCompleted,
          user?.id
        );
      } catch {
        if (user?.id) {
          try {
            await enqueuePending(user.id, {
              id:
                payload.operation_id ||
                operationIdFromParts(user.id, payload.activity_id, 'cv'),
              kind: 'workout_create',
              payload,
            });
            Alert.alert(
              'Saved on this device',
              'Your workout will sync when you are back online.'
            );
          } catch {
            Alert.alert(
              'Could not save workout',
              'Your progress could not be stored. Please try again.'
            );
          }
        } else {
          Alert.alert('Could not save workout', 'Please sign in and try again.');
        }
      }
      router.back();
    },
    [router, user?.id]
  );

  const savePartialAndExit = useCallback(
    (totalDone: number) => {
      if (completedRef.current || totalDone <= 0) {
        router.back();
        return;
      }
      completedRef.current = true;
      const fraction = Math.round((totalDone / Math.max(1, plan.totalReps)) * 100);
      setCompleted(true);
      provideFeedback({
        text: `Partial session saved. ${totalDone} of ${plan.totalReps} reps recorded.`,
        priority: 'high',
        haptic: 'success'
      });
      void logCompletion(makePayload(fraction, totalDone, 'camera'), totalDone);
    },
    [logCompletion, makePayload, plan.totalReps, provideFeedback, router]
  );

  const handleExitRequest = useCallback(() => {
    if (completedRef.current) {
      router.back();
      return;
    }
    const finishedReps = finishedSidesRef.current.length * plan.repsPerSide;
    const totalDone = finishedReps + progressRef.current.sideReps;

    if (totalDone === 0) {
      Alert.alert('Leave session?', 'No reps have been counted yet.', [
        { text: 'Keep going', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => router.back() }
      ]);
      return;
    }

    Alert.alert(
      'Save your progress?',
      `You've completed ${totalDone} of ${plan.totalReps} reps. Save it as a partial session?`,
      [
        {
          text: 'Save progress',
          onPress: () => savePartialAndExit(totalDone)
        },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        { text: 'Keep going', style: 'cancel' }
      ]
    );
  }, [plan.repsPerSide, plan.totalReps, router, savePartialAndExit]);

  const finalizeSession = useCallback(
    (score: number) => {
      if (completedRef.current) return;
      completedRef.current = true;
      setCompleted(true);
      const reps = accumulatedRepsRef.current;
      const averageScore =
        scoreCountRef.current > 0
          ? Math.round(scoreSumRef.current / scoreCountRef.current)
          : score;

      emitCvSessionResult({
        exerciseId,
        family,
        reps,
        score: averageScore
      });

      const payload = makePayload(
        100,
        reps,
        'camera',
        averageScore,
        Array.from(issueCodesRef.current)
      );
      void logCompletion(payload, reps);
    },
    [exerciseId, family, logCompletion, makePayload, router]
  );

  const handleSessionComplete = useCallback(
    (result: { reps: number; score: number; issues?: string[] }) => {
      if (completedRef.current) return;

      const currentSide = activeSideRef.current;
      accumulatedRepsRef.current += result.reps;
      scoreSumRef.current += result.score;
      scoreCountRef.current += 1;
      for (const code of result.issues ?? []) {
        issueCodesRef.current.add(code);
      }
      progressRef.current.sideReps = 0;

      if (isBilateral && !finishedSidesRef.current.includes(currentSide)) {
        const nextFinished = [...finishedSidesRef.current, currentSide];
        finishedSidesRef.current = nextFinished;

        if (nextFinished.length === 2) {
          finalizeSession(result.score);
          return;
        }

        const nextSide: Side = currentSide === 'right' ? 'left' : 'right';
        const finishedLabel = currentSide === 'right' ? 'Right' : 'Left';
        activeSideRef.current = nextSide;
        setActiveSide(nextSide);
        provideFeedback({
          text: `${finishedLabel} side complete. Switch to your ${nextSide} side. Calibrate and complete ${plan.repsPerSide} repetitions.`,
          priority: 'high',
          haptic: 'success'
        });
        return;
      }

      finalizeSession(result.score);
    },
    [finalizeSession, isBilateral, plan.repsPerSide, provideFeedback]
  );

  const handleManualRequest = useCallback(() => {
    requestManualSession({
      exerciseId,
      family,
      name: exerciseName,
      sets: plan.setsPerSide,
      reps: plan.repsPerSet,
      restSeconds,
      repMode: params.repMode as ManualSessionRequest['repMode'] | undefined
    });
    router.back();
  }, [
    exerciseId,
    exerciseName,
    family,
    params.repMode,
    plan.repsPerSet,
    plan.setsPerSide,
    restSeconds,
    router
  ]);

  const handleProgress = useCallback((progress: SessionProgress) => {
    progressRef.current = progress;
  }, []);

  return (
    <View style={styles.screen}>
      <Suspense
        fallback={
          <View style={styles.loadingFallback}>
            <Text style={styles.doneText}>Loading pose engine…</Text>
          </View>
        }
      >
        <CvDemoScreen
          key={sessionKey}
          exerciseId={family}
          exerciseName={exerciseName}
          sessionKey={sessionKey}
          onExit={handleExitRequest}
          facing="front"
          showExerciseSwitcher={false}
          targetReps={plan.repsPerSide}
          repsPerSet={plan.repsPerSet}
          restSeconds={restSeconds}
          bilateral={isBilateral}
          sideOverride={activeSide}
          onManualRequest={handleManualRequest}
          onProgress={handleProgress}
          onSessionComplete={handleSessionComplete}
        />
      </Suspense>
      {completed ? (
        <View style={styles.donePill} pointerEvents="none">
          <Text style={styles.doneText}>Session recorded</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b1220'
  },
  screen: {
    flex: 1,
    backgroundColor: '#0b1220'
  },
  donePill: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    zIndex: 100,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(20, 83, 45, 0.95)'
  },
  doneText: {
    color: '#ffffff',
    fontWeight: '900'
  }
});

import { useCallback, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { CvDemoScreen } from '../../src/CvDemoScreen';
import { ExerciseId, Side } from '../../src/cv/types';
import { emitCvSessionResult } from '../../src/cv/sessionEvents';
import { workoutService } from '../../services';
import { useAccessibility } from '../../context/AccessibilityContext';
import { WorkoutCompletionPayload } from '../../types/domain';
import { useAuth } from '../../context/AuthContext';

const BILATERAL_FAMILIES: ExerciseId[] = ['lunge', 'bicep_curl', 'supported_row'];

export default function CvSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    exerciseId?: string;
    family?: string;
    name?: string;
    sets?: string;
    reps?: string;
    target?: string;
    activityId?: string;
    progressionKey?: string;
    sessionType?: string;
  }>();
  const { provideFeedback } = useAccessibility();
  const { user } = useAuth();

  const family = (params.family ?? 'squat') as ExerciseId;
  const exerciseId = params.exerciseId ?? `ex-${family}`;
  const totalReps = Number(params.target ?? (Number(params.sets || 2) * Number(params.reps || 8)));
  const bilateral = BILATERAL_FAMILIES.includes(family);
  const perSideReps = Math.ceil(totalReps / 2);
  const [activeSide, setActiveSide] = useState<Side>('right');
  const [finishedSides, setFinishedSides] = useState<Side[]>([]);
  const [completed, setCompleted] = useState(false);
  const completedRef = useRef(false);
  const stateRef = useRef({ activeSide, finishedSides });
  stateRef.current = { activeSide, finishedSides };

  async function finalizeSession(result: { reps: number; score: number }) {
    if (completedRef.current) return;
    completedRef.current = true;
    setCompleted(true);

    emitCvSessionResult({
      exerciseId,
      family,
      reps: result.reps,
      score: result.score
    });

    const payload: WorkoutCompletionPayload = {
      user_id: user?.id || 'user_default',
      activity_id: params.activityId || 'strength',
      requested_activity_id: params.activityId || 'strength',
      progression_key: params.progressionKey || params.activityId || 'strength',
      session_type: params.sessionType,
      completion_pct: 100,
      exercise_completion_pct: {
        [family]: result.score
      }
    };

    await workoutService.logWorkoutCompletion(payload, 25, result.reps, user?.id);
    router.back();
  }

  const handleSessionComplete = useCallback(
    (result: { reps: number; score: number }) => {
      if (completedRef.current) return;

      const { activeSide: currentSide, finishedSides: done } = stateRef.current;

      if (bilateral && !done.includes(currentSide)) {
        const nextSide: Side = currentSide === 'right' ? 'left' : 'right';
        const newFinished = [...done, currentSide];
        setFinishedSides(newFinished);

        if (newFinished.length === 2) {
          finalizeSession(result);
          return;
        }

        setActiveSide(nextSide);
        provideFeedback({
          text: `Switch to your ${nextSide} side. Calibrate and complete ${perSideReps} repetitions.`,
          priority: 'high',
          haptic: 'success'
        });
        return;
      }

      finalizeSession(result);
    },
    // Stays stable across renders; reads the latest side/finished via ref.
    [bilateral, perSideReps, provideFeedback]
  );

  return (
    <View style={styles.screen}>
      <CvDemoScreen
        exerciseId={family}
        onExit={() => router.back()}
        facing="front"
        showExerciseSwitcher={false}
        targetReps={bilateral ? perSideReps : totalReps}
        bilateral={bilateral}
        sideOverride={activeSide}
        onSessionComplete={handleSessionComplete}
      />
      {completed ? (
        <View style={styles.donePill} pointerEvents="none">
          <Text style={styles.doneText}>Session complete</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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

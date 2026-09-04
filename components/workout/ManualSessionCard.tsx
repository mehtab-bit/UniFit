import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Exercise } from '../../types/domain';
import { buildSessionPlan } from '../../src/cv/sessionPlan';
import { Side } from '../../src/cv/types';
import { useAccessibility } from '../../context/AccessibilityContext';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { PrimaryButton } from '../common/PrimaryButton';
import { ScalePressable } from '../animations/ScalePressable';

type ManualSessionCardProps = {
  exercise: Exercise;
  onProgress?: (totalDone: number, totalTarget: number) => void;
  onComplete: (result: { reps: number; side: Side }) => void;
  onEndRequest: () => void;
};

function sideWord(side: Side) {
  return side === 'right' ? 'Right' : 'Left';
}

/**
 * Honest manual-counting mode: one tap per rep, audio + haptic confirmation,
 * real sets/rest and side structure. It never fabricates a score — only
 * camera sessions produce range scores.
 */
export function ManualSessionCard({
  exercise,
  onProgress,
  onComplete,
  onEndRequest
}: ManualSessionCardProps) {
  const plan = buildSessionPlan({
    family: exercise.family,
    sets: exercise.sets,
    reps: exercise.reps,
    repMode: exercise.repMode
  });
  const { provideFeedback } = useAccessibility();

  const [side, setSide] = useState<Side>('right');
  const [sideReps, setSideReps] = useState(0);
  const [totalDone, setTotalDone] = useState(0);
  const [restRemaining, setRestRemaining] = useState(0);
  const [restAction, setRestAction] = useState<'next_set' | 'switch_side' | null>(null);
  const [finished, setFinished] = useState(false);
  const finishedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onProgressRef = useRef(onProgress);
  const restSecondsRef = useRef(exercise.restSeconds ?? 70);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onProgressRef.current = onProgress;
  }, [onComplete, onProgress]);

  const totalTarget = plan.totalReps;

  useEffect(() => {
    onProgressRef.current?.(totalDone, totalTarget);
  }, [totalDone, totalTarget]);

  function startRest(action: 'next_set' | 'switch_side') {
    const seconds = Math.max(1, Math.round(restSecondsRef.current || 70));
    setRestAction(action);
    setRestRemaining(seconds);
    provideFeedback({
      text:
        action === 'switch_side'
          ? `${sideWord(side)} side complete. Rest ${seconds} seconds, then switch sides.`
          : `Set complete. Rest ${seconds} seconds.`,
      priority: 'high',
      haptic: 'success'
    });
  }

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinished(true);
    provideFeedback({
      text: `${exercise.name} complete. ${totalTarget} repetitions recorded manually.`,
      priority: 'high',
      haptic: 'success'
    });
    onCompleteRef.current({ reps: totalTarget, side });
  }

  function countRep() {
    if (finished || restRemaining > 0) return;
    const next = sideReps + 1;
    setSideReps(next);
    setTotalDone((current) => current + 1);
    provideFeedback({
      text: `${sideWord(side)} side, rep ${next} of ${plan.repsPerSide}.`,
      repCount: totalDone + 1,
      haptic: 'light'
    });

    const isSideComplete = next === plan.repsPerSide;
    if (isSideComplete) {
      if (plan.bilateral) {
        if (side === 'left') {
          finish();
          return;
        }
        startRest('switch_side');
        return;
      }
      finish();
      return;
    }

    if (next % plan.repsPerSet === 0) {
      startRest('next_set');
    }
  }

  // Rest countdown. On reaching zero, either begin the next set or switch sides.
  useEffect(() => {
    if (restRemaining <= 0) return;
    const timer = setTimeout(() => {
      setRestRemaining((remaining) => {
        return remaining - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [restRemaining]);

  // Handle what happens the moment the rest countdown finishes.
  useEffect(() => {
    if (restRemaining > 0 || !restAction) return;
    if (restAction === 'switch_side') {
      setSide((current) => (current === 'right' ? 'left' : 'right'));
      setSideReps(0);
      provideFeedback({
        text: 'Rest complete. Switch sides and begin.',
        priority: 'high',
        haptic: 'success'
      });
    } else {
      provideFeedback({
        text: 'Rest complete. Begin your next set.',
        priority: 'high',
        haptic: 'success'
      });
    }
    setRestAction(null);
  }, [provideFeedback, restAction, restRemaining]);

  const currentSet = Math.min(
    plan.setsPerSide,
    Math.floor(sideReps / Math.max(1, plan.repsPerSet)) + 1
  );

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.manualBadge}>
          <Text style={styles.manualBadgeText}>MANUAL REPS</Text>
        </View>
        <Text style={styles.targetBadge}>
          {exercise.sets || plan.setsPerSide} × {exercise.reps || plan.repsPerSet}
        </Text>
      </View>

      <Text style={styles.title}>{exercise.name.toUpperCase()}</Text>
      <Text style={styles.subtitle}>
        Tap “Count a Rep” for each repetition. Audio and haptics confirm every
        rep — no camera needed.
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {totalDone}
            <Text style={styles.statDenom}> / {totalTarget}</Text>
          </Text>
          <Text style={styles.statLabel}>REPS</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {plan.bilateral ? sideWord(side) : '—'}
          </Text>
          <Text style={styles.statLabel}>SIDE</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>
            {currentSet}
            <Text style={styles.statDenom}> / {plan.setsPerSide}</Text>
          </Text>
          <Text style={styles.statLabel}>SET</Text>
        </View>
      </View>

      {restRemaining > 0 ? (
        <View style={styles.restBanner}>
          <Text style={styles.restText}>REST — {restRemaining}s</Text>
        </View>
      ) : null}

      <PrimaryButton
        title={finished ? 'Session recorded' : 'Count a Rep'}
        onPress={countRep}
        disabled={finished || restRemaining > 0}
        accessibilityLabel="Count one repetition"
        accessibilityHint="Records one manual repetition with audio and haptic confirmation"
      />
      <View style={{ height: 10 }} />
      <ScalePressable
        onPress={onEndRequest}
        accessibilityRole="button"
        accessibilityLabel="End exercise"
        accessibilityHint="Finishes or saves the current manual session"
        style={styles.endButton}
      >
        <Text style={styles.endButtonText}>End exercise</Text>
      </ScalePressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: Layout.borderRadius.xl,
    padding: Layout.spacing.lg,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    marginBottom: Layout.spacing.lg
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.sm
  },
  manualBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  manualBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5
  },
  targetBadge: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary
  },
  title: {
    ...Typography.h2,
    fontSize: 20,
    color: Colors.text,
    marginTop: 2
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 6,
    marginBottom: Layout.spacing.md,
    lineHeight: 18
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#001554',
    borderRadius: Layout.borderRadius.xl,
    paddingVertical: Layout.spacing.md,
    marginBottom: Layout.spacing.md
  },
  statBox: {
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  statDenom: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9E9FA9'
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00C8FF',
    letterSpacing: 0.8,
    marginTop: 4
  },
  restBanner: {
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: '#0284C7',
    marginBottom: Layout.spacing.md
  },
  restText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15
  },
  endButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark,
    borderRadius: Layout.borderRadius.lg,
    paddingVertical: Layout.spacing.md,
    minHeight: 46
  },
  endButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.textInverse,
    fontSize: 14
  }
});

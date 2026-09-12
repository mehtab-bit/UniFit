import { AngleCalibration } from './types';
import { getExerciseProgress } from './feedback';

export type RepCounterState = {
  phase: 'start' | 'end';
  reps: number;
  lastRepAt: number;
  /** False until the first live angle after a reset locks the starting phase. */
  primed: boolean;
};

export function createRepCounterState(): RepCounterState {
  return {
    phase: 'start',
    reps: 0,
    lastRepAt: 0,
    primed: false
  };
}

export function updateRepCounter(
  state: RepCounterState,
  angle: number | null,
  calibration: AngleCalibration | null
): RepCounterState {
  if (angle === null || !calibration) {
    return state;
  }

  const progress = getExerciseProgress(angle, calibration);
  const now = Date.now();

  // A fresh counter has no idea where in the movement the user is, so lock
  // the starting phase from the first live angle instead of assuming they
  // started at the start pose. Calibration finishes while the user is still
  // holding the end pose; treating that as "already at the end" means the
  // next rep only counts after the user returns to the start first.
  if (!state.primed) {
    return {
      ...state,
      phase: progress >= 0.5 ? 'end' : 'start',
      primed: true
    };
  }

  // A rep is completed when the user REACHES the calibrated end position —
  // the top of a curl, the bottom of a squat. Returning to start resets the
  // state for the next rep instead of being the counting event. Counting on
  // the return was what made curls register mid-descent and feel inverted.
  const minimumRepIntervalMs = 600;
  if (
    state.phase === 'start' &&
    progress >= 0.85 &&
    now - state.lastRepAt >= minimumRepIntervalMs
  ) {
    return {
      phase: 'end',
      reps: state.reps + 1,
      lastRepAt: now,
      primed: state.primed
    };
  }

  if (state.phase === 'end' && progress <= 0.15) {
    return {
      phase: 'start',
      reps: state.reps,
      lastRepAt: state.lastRepAt,
      primed: state.primed
    };
  }

  return state;
}

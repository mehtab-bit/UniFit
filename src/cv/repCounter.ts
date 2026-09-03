import { AngleCalibration } from './types';
import { getExerciseProgress } from './feedback';

export type RepCounterState = {
  phase: 'start' | 'end';
  reps: number;
};

export function createRepCounterState(): RepCounterState {
  return {
    phase: 'start',
    reps: 0
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

  // A rep is completed when the user REACHES the calibrated end position —
  // the top of a curl, the bottom of a squat. Returning to start resets the
  // state for the next rep instead of being the counting event. Counting on
  // the return was what made curls register mid-descent and feel inverted.
  if (state.phase === 'start' && progress >= 0.95) {
    return {
      phase: 'end',
      reps: state.reps + 1
    };
  }

  if (state.phase === 'end' && progress <= 0.05) {
    return {
      phase: 'start',
      reps: state.reps
    };
  }

  return state;
}

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

  if (state.phase === 'start' && progress >= 0.8) {
    return {
      phase: 'end',
      reps: state.reps
    };
  }

  if (state.phase === 'end' && progress <= 0.2) {
    return {
      phase: 'start',
      reps: state.reps + 1
    };
  }

  return state;
}

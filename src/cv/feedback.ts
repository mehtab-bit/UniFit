import { AngleCalibration, FeedbackState } from './types';

export function getExerciseProgress(angle: number, calibration: AngleCalibration) {
  const range = calibration.endAngle - calibration.startAngle;

  if (Math.abs(range) < 1) {
    return 0;
  }

  const progress = (angle - calibration.startAngle) / range;
  return Math.max(0, Math.min(1, progress));
}

export function getFeedbackState(
  angle: number | null,
  calibration: AngleCalibration | null,
  target: 'up' | 'down'
): FeedbackState {
  if (angle === null) {
    return 'not_visible';
  }

  if (!calibration) {
    return 'needs_calibration';
  }

  const progress = getExerciseProgress(angle, calibration);

  if (target === 'up') {
    if (progress < 0.75) {
      return 'move_up';
    }

    return 'good';
  }

  if (progress > 0.25) {
    return 'move_down';
  }

  return 'good';
}

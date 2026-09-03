import { AngleCalibration, FeedbackState } from './types';

export function getExerciseProgress(angle: number, calibration: AngleCalibration) {
  const range = calibration.endAngle - calibration.startAngle;

  if (Math.abs(range) < 1) {
    return 0;
  }

  const progress = (angle - calibration.startAngle) / range;
  return Math.max(0, Math.min(1, progress));
}

/**
 * Some movements bend a joint (angle DECREASES from start to end): curls,
 * rows, push-ups. Others extend it (angle INCREASES from start to end):
 * squats, lunges. Everything below must agree on direction or the live
 * feedback and rep counting invert. Exercise definitions expose this.
 */
export type MovementDirection = 'bends' | 'extends';

export function directionForExercise(
  exerciseId: string,
  startAngle: number,
  endAngle: number
): MovementDirection {
  // The calibrated ranges are the ground truth: if the user's end pose has a
  // smaller joint angle (more bent) the movement bends the joint.
  return endAngle < startAngle ? 'bends' : 'extends';
}

export function getFeedbackState(
  angle: number | null,
  calibration: AngleCalibration | null,
  target: 'up' | 'down', // phase-driven target kept for API compatibility
  exerciseId?: string
): FeedbackState {
  if (angle === null) {
    return 'not_visible';
  }

  if (!calibration) {
    return 'needs_calibration';
  }

  const progress = getExerciseProgress(angle, calibration);

  // Calibration is canonical: start = straight/standing (LARGE angle), end =
  // bent/peak contraction (SMALL angle). A rep is registered when the user
  // REACHES the end (progress ~1). While they are on the way there we cue
  // them to keep closing the joint ("up"); after the rep, while returning to
  // start we cue them to open back out ("down").
  if (target === 'up') {
    return progress < 0.75 ? 'move_up' : 'good';
  }
  return progress > 0.1 ? 'move_down' : 'good';
}

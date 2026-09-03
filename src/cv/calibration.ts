import { isStableAngle } from './math';
import { AngleCalibration } from './types';

export function captureCalibrationAngle(values: number[]) {
  if (!isStableAngle(values)) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round((total / values.length) * 10) / 10;
}

export function createCalibration(startAngle: number, endAngle: number): AngleCalibration {
  return {
    startAngle,
    endAngle
  };
}

/**
 * All five strength families move from a large joint angle (straight /
 * standing) to a small joint angle (bent / squat bottom / curl peak). If a
 * user's two calibration holds are captured in reverse order, the rep counter
 * and feedback invert. Canonicalize so start is always the larger angle.
 */
/**
 * Rep math assumes start (large angle) -> end (small angle). Auto-calibration
 * can capture the two holds in either order depending on how the user moves,
 * so canonicalize: the larger measured angle is ALWAYS the start.
 */
export function normalizeCalibration(a: number, b: number): AngleCalibration {
  if (a >= b) {
    return createCalibration(a, b);
  }
  return createCalibration(b, a);
}

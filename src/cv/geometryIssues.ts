import { findKeypoint } from './math';
import { CvKeypoint, ExerciseId, Side } from './types';
import { QualityIssue } from './quality';

/**
 * Tunable geometry thresholds. These are deliberately conservative and must be
 * validated on-device per exercise before being presented as absolute form
 * claims (see docs/performance.md's device-tuning rule).
 */
const TORSO_LEAN_MAX_DEG = 18;
const HIP_DROP_RATIO = 0.12;

function distance(a: CvKeypoint, b: CvKeypoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Lightweight checks that work from the side view the exercises already ask
 * for. Each check returns a correction only when geometry is clearly outside
 * the tolerable range, so it never nags on normal movement.
 */
export function assessGeometryIssues(
  exerciseId: ExerciseId,
  keypoints: CvKeypoint[],
  side: Side
): QualityIssue[] {
  const issues: QualityIssue[] = [];

  if (exerciseId === 'squat' || exerciseId === 'lunge') {
    const shoulder = findKeypoint(keypoints, `${side}_shoulder`);
    const hip = findKeypoint(keypoints, `${side}_hip`);
    if (shoulder && hip) {
      const verticalSpan = Math.abs(hip.y - shoulder.y);
      const horizontalOffset = Math.abs(shoulder.x - hip.x);
      if (verticalSpan > 0.02) {
        const leanDegrees =
          (Math.atan2(horizontalOffset, verticalSpan) * 180) / Math.PI;
        if (leanDegrees > TORSO_LEAN_MAX_DEG) {
          issues.push({
            code: 'torso_lean',
            correction:
              'Keep your chest up — avoid leaning too far forward from the hips.',
            severity: 12
          });
        }
      }
    }
  }

  if (exerciseId === 'pushup') {
    const shoulder = findKeypoint(keypoints, `${side}_shoulder`);
    const hip = findKeypoint(keypoints, `${side}_hip`);
    const ankle = findKeypoint(keypoints, `${side}_ankle`);
    if (shoulder && hip && ankle) {
      const bodyLine = distance(shoulder, ankle);
      if (bodyLine > 0.02) {
        // Signed distance of the hip from the shoulder→ankle line. Sagging
        // hips push the hip below the line; piking pushes it above it.
        const dx = ankle.x - shoulder.x;
        const dy = ankle.y - shoulder.y;
        const lineLength = Math.hypot(dx, dy);
        const hipDistance =
          Math.abs(dx * (shoulder.y - hip.y) - (shoulder.x - hip.x) * dy) /
          lineLength;
        if (hipDistance / bodyLine > HIP_DROP_RATIO) {
          issues.push({
            code: 'hip_drop',
            correction:
              'Keep your hips in line with your body — don\u2019t let them sag or pike.',
            severity: 20
          });
        }
      }
    }
  }

  return issues;
}

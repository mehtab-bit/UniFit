import { findKeypoint } from './math';
import { AngleCalibration, CvKeypoint, ExerciseId, Side } from './types';
import { getExerciseProgress } from './feedback';

export type QualityIssue = {
  code: string;
  correction: string;
  severity: number;
};

export type QualityAssessment = {
  score: number;
  issues: QualityIssue[];
  correction?: string;
};

// Tunable thresholds. These are deliberately calibration-friendly rather than
// absolute: adjust after testing the actual phone/camera setup and exercise
// variations used by the target athletes.
const KNEE_AHEAD_RATIO = 0.25;
const ELBOW_DRIFT_RATIO = 0.25;
const TRUNK_STRAIGHT_MIN_DEG = 150;

function distance(a: CvKeypoint, b: CvKeypoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function flag(issues: QualityIssue[], code: string, correction: string, severity: number) {
  issues.push({ code, correction, severity });
}

function pair(
  keypoints: CvKeypoint[],
  side: Side,
  part: 'shoulder' | 'elbow' | 'wrist' | 'hip' | 'knee' | 'ankle'
) {
  return findKeypoint(keypoints, `${side}_${part}` as CvKeypoint['name']);
}

/**
 * Runs lightweight geometric checks that are safe to run at phone FPS.
 * The primary rep count still comes from the calibrated joint angle; these
 * checks only adjust the form score and produce spoken corrections.
 */
export function assessQuality(
  exerciseId: ExerciseId,
  keypoints: CvKeypoint[],
  side: Side,
  angle: number | null,
  calibration: AngleCalibration | null,
  geometricIssues: QualityIssue[] = []
): QualityAssessment {
  const issues: QualityIssue[] = [];

  if (angle === null) {
    issues.push({
      code: 'not_visible',
      correction: 'Move into the camera frame so your joints stay visible.',
      severity: 20
    });
  }

  // The calibrated joint angle is the reliable, camera-view-independent form
  // signal. Pixel-space heuristics (elbow drift, knee-ahead ratios) are
  // unusable from the side/front views real phones capture, so base the
  // quality score on movement depth relative to the calibration instead.
  if (angle !== null && calibration !== null) {
    const range = Math.abs(calibration.endAngle - calibration.startAngle);
    if (range < 5) {
      flag(issues, 'calibration', 'Calibration range is too small. Re-calibrate with a fuller range of motion.', 20);
    } else {
      const depth = getExerciseProgress(angle, calibration);
      // `depth` measures progress from the calibrated START toward the END.
      // For every one of the five families the END pose is the "working" end
      // (curl peak, squat bottom), so good form requires getting most of the
      // way there — not hovering near the start.
      const isShallow = depth < 0.55;
      if (isShallow) {
        flag(
          issues,
          'depth',
          exerciseId === 'bicep_curl' || exerciseId === 'supported_row'
            ? 'Lift through a fuller range — take the joint all the way through the movement.'
            : 'Move through the full calibrated range of the exercise.',
          10
        );
      }
    }
  }

  for (const issue of geometricIssues) {
    if (!issues.some((existing) => existing.code === issue.code)) {
      issues.push(issue);
    }
  }

  const severitySum = issues.reduce((total, issue) => total + issue.severity, 0);
  const score = Math.max(0, Math.min(100, Math.round(100 - severitySum)));
  const worst = [...issues].sort((a, b) => b.severity - a.severity)[0];

  return {
    score,
    issues,
    correction: worst?.correction
  };
}

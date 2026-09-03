import { findKeypoint } from './math';
import { CvKeypoint, ExerciseId, Side } from './types';

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
  angle: number | null
): QualityAssessment {
  const issues: QualityIssue[] = [];

  if (angle === null) {
    issues.push({
      code: 'not_visible',
      correction: 'Move into the camera frame so your joints stay visible.',
      severity: 20
    });
  }

  if (exerciseId === 'squat' || exerciseId === 'lunge') {
    const hip = pair(keypoints, side, 'hip');
    const knee = pair(keypoints, side, 'knee');
    const ankle = pair(keypoints, side, 'ankle');
    const shoulder = pair(keypoints, side, 'shoulder');

    if (hip && knee && ankle && shoulder) {
      const scale = Math.max(1, distance(hip, ankle));
      const kneeAheadRatio = (knee.x - ankle.x) / scale;
      if (kneeAheadRatio > KNEE_AHEAD_RATIO) {
        flag(issues, 'knee_tracking', 'Keep your knee tracking above your ankle, not forward of your toes.', 12);
      }

      const torsoDegrees = Math.abs(angleAt(shoulder, hip, ankle));
      if (torsoDegrees < TRUNK_STRAIGHT_MIN_DEG) {
        flag(issues, 'torso', 'Keep your chest upright and spine neutral.', 8);
      }
    }
  }

  if (exerciseId === 'bicep_curl' || exerciseId === 'supported_row') {
    const shoulder = pair(keypoints, side, 'shoulder');
    const elbow = pair(keypoints, side, 'elbow');
    const wrist = pair(keypoints, side, 'wrist');

    if (shoulder && elbow && wrist) {
      const scale = Math.max(1, distance(shoulder, wrist));
      const elbowDrift = Math.abs(elbow.x - shoulder.x) / scale;
      if (elbowDrift > ELBOW_DRIFT_RATIO) {
        flag(
          issues,
          'elbow_drift',
          exerciseId === 'bicep_curl'
            ? 'Keep your elbows pinned close to your ribs.'
            : 'Keep your elbow path close to your torso without twisting.',
          10
        );
      }
    }
  }

  if (exerciseId === 'pushup') {
    const shoulder = pair(keypoints, side, 'shoulder');
    const hip = pair(keypoints, side, 'hip');
    const ankle = pair(keypoints, side, 'ankle');
    if (shoulder && hip && ankle) {
      const bodyDegrees = Math.abs(angleAt(shoulder, hip, ankle));
      if (bodyDegrees < TRUNK_STRAIGHT_MIN_DEG) {
        flag(issues, 'hip_sag', 'Keep your body in a straight line; do not let your hips sag.', 12);
      }
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

function angleAt(a: CvKeypoint, center: CvKeypoint, c: CvKeypoint) {
  const firstAngle = Math.atan2(a.y - center.y, a.x - center.x);
  const secondAngle = Math.atan2(c.y - center.y, c.x - center.x);
  let degrees = Math.abs((secondAngle - firstAngle) * 180) / Math.PI;
  return degrees > 180 ? 360 - degrees : degrees;
}

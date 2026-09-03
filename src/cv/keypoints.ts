import { CvKeypoint, KeypointName } from './types';

const moveNetKeypointNames: KeypointName[] = [
  'nose',
  'left_eye',
  'right_eye',
  'left_ear',
  'right_ear',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle'
];

type PoseDetectionKeypoint = {
  name?: string;
  x: number;
  y: number;
  score?: number;
};

export function normalizeKeypoints(keypoints: PoseDetectionKeypoint[]): CvKeypoint[] {
  const normalizedKeypoints: CvKeypoint[] = [];

  // MoveNet returns pixel coordinates in the 192×192 inference space. Convert
  // to 0..1 fractions once here so every consumer (dots, skeleton, angle math)
  // shares the same coordinate system.

  for (let index = 0; index < keypoints.length; index += 1) {
    const keypoint = keypoints[index];
    const name = keypoint.name ?? moveNetKeypointNames[index];

    if (moveNetKeypointNames.includes(name as KeypointName)) {
      normalizedKeypoints.push({
        name: name as KeypointName,
        x: keypoint.x / 192,
        y: keypoint.y / 192,
        score: keypoint.score
      });
    }
  }

  return normalizedKeypoints;
}

export function getVisibleKeypoints(
  keypoints: CvKeypoint[],
  names: KeypointName[],
  minimumScore = 0.35
) {
  return keypoints.filter((keypoint) => {
    const hasEnoughConfidence =
      typeof keypoint.score !== 'number' || keypoint.score >= minimumScore;

    return names.includes(keypoint.name) && hasEnoughConfidence;
  });
}

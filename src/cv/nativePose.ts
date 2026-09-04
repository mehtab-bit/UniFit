import { CvKeypoint, KeypointName } from './types';

/**
 * Native MediaPipe PoseLandmarker → CvKeypoint adapter.
 *
 * The wrapper's pose channel returns up to 33 normalized landmarks ordered by
 * the MediaPipe Pose index. Only the 17 names this app's math uses are mapped.
 * Coordinates are already normalized 0..1, so no 192-division is needed.
 */
export type NativePosePoint = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
};

export type NativePoseFrame = {
  pose?: NativePosePoint[];
  imageWidth?: number;
  imageHeight?: number;
  error?: string;
};

const NATIVE_POSE_INDEX: ReadonlyArray<readonly [KeypointName, number]> = [
  ['nose', 0],
  ['left_eye', 2],
  ['right_eye', 5],
  ['left_ear', 7],
  ['right_ear', 8],
  ['left_shoulder', 11],
  ['right_shoulder', 12],
  ['left_elbow', 13],
  ['right_elbow', 14],
  ['left_wrist', 15],
  ['right_wrist', 16],
  ['left_hip', 23],
  ['right_hip', 24],
  ['left_knee', 25],
  ['right_knee', 26],
  ['left_ankle', 27],
  ['right_ankle', 28]
];

export function nativePoseToCvKeypoints(
  pose: NativePosePoint[] | undefined
): CvKeypoint[] {
  if (!pose || pose.length === 0) {
    return [];
  }
  const keypoints: CvKeypoint[] = [];
  for (const [name, index] of NATIVE_POSE_INDEX) {
    const point = pose[index];
    if (!point) continue;
    keypoints.push({
      name,
      x: point.x,
      y: point.y,
      score:
        typeof point.visibility === 'number'
          ? Math.max(0, Math.min(1, point.visibility))
          : undefined
    });
  }
  return keypoints;
}

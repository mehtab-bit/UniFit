import React from 'react';
import { View } from 'react-native';
import { CvKeypoint, KeypointName, Side } from './types';
import { KEYPOINT_MIN_SCORE } from './confidence';
import { keypointToViewPx, SourceSize } from './overlayGeometry';
import { trackRenderBurst } from './debugRenderCount';

const BONES: Array<[KeypointName, KeypointName]> = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle']
];

const GOOD = '#22c55e';
const WARN = '#f59e0b';

type SkeletonOverlayProps = {
  keypoints: CvKeypoint[];
  mirrorX: boolean;
  size: { width: number; height: number };
  sourceSize?: SourceSize | null;
  activeSide?: Side;
  isGoodForm: boolean;
  requiredKeypointNames?: KeypointName[];
};

function toPx(
  keypoint: CvKeypoint,
  mirrorX: boolean,
  size: { width: number; height: number },
  sourceSize?: SourceSize | null
) {
  // Keypoints are normalized to 0..1 fractions by normalizeKeypoints.
  const fitted = keypointToViewPx(keypoint, size, sourceSize, mirrorX);
  return {
    x: fitted.x,
    y: fitted.y
  };
}

export function SkeletonOverlay({
  keypoints,
  mirrorX,
  size,
  sourceSize,
  activeSide,
  isGoodForm,
  requiredKeypointNames
}: SkeletonOverlayProps) {
  trackRenderBurst('SkeletonOverlay');
  if (keypoints.length === 0) {
    return null;
  }

  const byName = new Map(keypoints.map((keypoint) => [keypoint.name, keypoint]));
  const requiredNames = new Set(requiredKeypointNames ?? []);

  const primaryColor = isGoodForm ? GOOD : WARN;

  const lines = BONES.map(([start, end], index) => {
    // The coach skeleton shows only the joints the current exercise tracks:
    // full-body bones just read as noise next to the form feedback.
    if (requiredNames.size > 0 && (!requiredNames.has(start) || !requiredNames.has(end))) {
      return null;
    }
    const startKeypoint = byName.get(start);
    const endKeypoint = byName.get(end);
    if (
      !startKeypoint ||
      !endKeypoint ||
      (typeof startKeypoint.score === 'number' && startKeypoint.score < KEYPOINT_MIN_SCORE) ||
      (typeof endKeypoint.score === 'number' && endKeypoint.score < KEYPOINT_MIN_SCORE)
    ) {
      return null;
    }

    const isActive =
      activeSide &&
      (start.startsWith(`${activeSide}_`) || end.startsWith(`${activeSide}_`));
    const from = toPx(startKeypoint, mirrorX, size, sourceSize);
    const to = toPx(endKeypoint, mirrorX, size, sourceSize);
    const length = Math.max(1, Math.hypot(to.x - from.x, to.y - from.y));
    const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;

    return (
      <View
        key={`${start}-${end}`}
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: midX - length / 2,
          top: midY - 1.5,
          width: length,
          height: Math.max(2, isActive ? 4 : 2.5),
          backgroundColor: isActive ? primaryColor : '#22d3ee66',
          borderRadius: 2,
          opacity: isActive ? 1 : 0.5,
          transform: [{ rotate: `${angle}deg` }]
        }}
      />
    );
  });

  return <>{lines}</>;
}

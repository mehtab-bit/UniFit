import React from 'react';
import { View } from 'react-native';
import { CvKeypoint, KeypointName, Side } from './types';

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
  activeSide?: Side;
  isGoodForm: boolean;
};

function toPx(
  keypoint: CvKeypoint,
  mirrorX: boolean,
  size: { width: number; height: number }
) {
  // Keypoints are normalized to 0..1 fractions by normalizeKeypoints.
  const xFraction = mirrorX ? 1 - keypoint.x : keypoint.x;
  const yFraction = keypoint.y;
  return {
    x: xFraction * size.width,
    y: yFraction * size.height
  };
}

export function SkeletonOverlay({
  keypoints,
  mirrorX,
  size,
  activeSide,
  isGoodForm
}: SkeletonOverlayProps) {
  if (keypoints.length === 0) {
    return null;
  }

  const byName = new Map(keypoints.map((keypoint) => [keypoint.name, keypoint]));

  const primaryColor = isGoodForm ? GOOD : WARN;

  const lines = BONES.map(([start, end], index) => {
    const startKeypoint = byName.get(start);
    const endKeypoint = byName.get(end);
    if (
      !startKeypoint ||
      !endKeypoint ||
      (typeof startKeypoint.score === 'number' && startKeypoint.score < 0.35) ||
      (typeof endKeypoint.score === 'number' && endKeypoint.score < 0.35)
    ) {
      return null;
    }

    const isActive =
      activeSide &&
      (start.startsWith(`${activeSide}_`) || end.startsWith(`${activeSide}_`));
    const from = toPx(startKeypoint, mirrorX, size);
    const to = toPx(endKeypoint, mirrorX, size);
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

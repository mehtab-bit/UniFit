import { CvKeypoint, KeypointName } from './types';

export function findKeypoint(
  keypoints: CvKeypoint[],
  name: KeypointName,
  minimumScore = 0.35
) {
  const keypoint = keypoints.find((item) => item.name === name);

  if (!keypoint) {
    return null;
  }

  if (typeof keypoint.score === 'number' && keypoint.score < minimumScore) {
    return null;
  }

  return keypoint;
}

export function angleAtPoint(
  first: CvKeypoint,
  center: CvKeypoint,
  third: CvKeypoint
) {
  const firstAngle = Math.atan2(first.y - center.y, first.x - center.x);
  const secondAngle = Math.atan2(third.y - center.y, third.x - center.x);
  let degrees = Math.abs((secondAngle - firstAngle) * 180) / Math.PI;

  if (degrees > 180) {
    degrees = 360 - degrees;
  }

  return Math.round(degrees * 10) / 10;
}

export function smoothAngle(values: Array<number | null>, windowSize = 5) {
  const recentValues = values
    .filter((value): value is number => typeof value === 'number')
    .slice(-windowSize);

  if (recentValues.length === 0) {
    return null;
  }

  const total = recentValues.reduce((sum, value) => sum + value, 0);
  return Math.round((total / recentValues.length) * 10) / 10;
}

export function isStableAngle(values: number[], toleranceDegrees = 8) {
  if (values.length < 5) {
    return false;
  }

  const highest = Math.max(...values);
  const lowest = Math.min(...values);

  return highest - lowest <= toleranceDegrees;
}

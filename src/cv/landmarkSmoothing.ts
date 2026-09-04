import { CvKeypoint } from './types';

/**
 * Frame-rate-aware exponential smoothing keyed by landmark name. Missing
 * landmarks in the current frame are dropped rather than filled from memory.
 */
export function smoothLandmarks(
  previous: CvKeypoint[],
  current: CvKeypoint[],
  alpha: number
): CvKeypoint[] {
  if (previous.length === 0) {
    return current;
  }
  const previousMap = new Map(previous.map((point) => [point.name, point]));
  return current.map((point) => {
    const last = previousMap.get(point.name);
    if (!last) return point;
    return {
      ...point,
      x: last.x + (point.x - last.x) * alpha,
      y: last.y + (point.y - last.y) * alpha
    };
  });
}

export function keypointsMoved(
  a: CvKeypoint[],
  b: CvKeypoint[],
  threshold = 0.006
): boolean {
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; i += 1) {
    const ka = a[i];
    const kb = b[i];
    if (
      ka.name !== kb.name ||
      Math.abs(ka.x - kb.x) > threshold ||
      Math.abs(ka.y - kb.y) > threshold
    ) {
      return true;
    }
  }
  return false;
}

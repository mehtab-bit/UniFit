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
      Math.abs(ka.y - kb.y) > threshold ||
      Math.abs((ka.score ?? 0) - (kb.score ?? 0)) > 0.2
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Smoothing with missing-landmark hold and teleport handling.
 *
 * - Fast-moving landmarks snap quickly instead of leaving trails.
 * - A joint missing for a frame or two keeps its last position (up to
 *   `holdMs`) instead of flickering out, then disappears cleanly.
 * - Sub-deadband wobble keeps the previous smoothed position exactly, so a
 *   still pose renders perfectly still instead of creeping a pixel at a time.
 */
export function smoothWithHold(
  previous: CvKeypoint[],
  current: CvKeypoint[],
  alpha: number,
  teleportDistance: number,
  holdMs: number,
  now: number,
  lastSeen: Map<string, number>,
  deadbandDistance = 0
): CvKeypoint[] {
  if (previous.length === 0 && current.length === 0) {
    return [];
  }

  const previousMap = new Map(previous.map((point) => [point.name, point]));
  const seen = new Set<string>();
  const next: CvKeypoint[] = [];

  for (const point of current) {
    const last = previousMap.get(point.name);
    lastSeen.set(point.name, now);
    seen.add(point.name);
    if (!last) {
      next.push(point);
      continue;
    }
    const distance = Math.hypot(point.x - last.x, point.y - last.y);
    if (distance <= deadbandDistance) {
      next.push({ ...point, x: last.x, y: last.y });
      continue;
    }
    const effectiveAlpha =
      distance > teleportDistance ? 0.95 : Math.min(1, Math.max(0.05, alpha));
    next.push({
      ...point,
      x: last.x + (point.x - last.x) * effectiveAlpha,
      y: last.y + (point.y - last.y) * effectiveAlpha
    });
  }

  for (const point of previous) {
    if (seen.has(point.name)) continue;
    const lastSeenAt = lastSeen.get(point.name) ?? 0;
    if (now - lastSeenAt < holdMs) {
      next.push(point);
    } else {
      lastSeen.delete(point.name);
    }
  }

  return next;
}

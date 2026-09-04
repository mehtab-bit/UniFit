import { describe, expect, it } from 'vitest';
import { nativePoseToCvKeypoints } from '../nativePose';
import { NativePosePoint } from '../nativePose';
import {
  keypointsMoved,
  smoothLandmarks,
  smoothWithHold
} from '../landmarkSmoothing';
import { CvKeypoint } from '../types';

function makePoseFrame(overrides: Record<number, Partial<NativePosePoint>> = {}) {
  const pose: NativePosePoint[] = [];
  for (let index = 0; index < 33; index += 1) {
    const override = overrides[index] ?? {};
    pose.push({
      x: 0.1 + index * 0.02,
      y: 0.2 + index * 0.01,
      visibility: 0.9,
      ...override
    });
  }
  return pose;
}

describe('nativePoseToCvKeypoints', () => {
  it('maps the 17 used MediaPipe indices to the app keypoint names', () => {
    const keypoints = nativePoseToCvKeypoints(makePoseFrame());
    expect(keypoints).toHaveLength(17);
    expect(keypoints.find((point) => point.name === 'left_shoulder')?.x).toBe(
      0.1 + 11 * 0.02
    );
    expect(keypoints.find((point) => point.name === 'right_ankle')?.y).toBe(
      0.2 + 28 * 0.01
    );
    expect(keypoints.every((point) => point.score === 0.9)).toBe(true);
  });

  it('skips missing landmarks and keeps visibility absent as unknown', () => {
    const keypoints = nativePoseToCvKeypoints(
      makePoseFrame({
        11: { visibility: undefined },
        25: { visibility: 0.99 }
      })
    );
    expect(keypoints.find((point) => point.name === 'left_shoulder')?.score)
      .toBeUndefined();
    expect(keypoints.find((point) => point.name === 'left_knee')?.score)
      .toBe(0.99);
  });

  it('returns an empty list for an absent pose', () => {
    expect(nativePoseToCvKeypoints(undefined)).toEqual([]);
    expect(nativePoseToCvKeypoints([])).toEqual([]);
  });
});

function point(name: CvKeypoint['name'], x: number, y: number): CvKeypoint {
  return { name, x, y, score: 0.9 };
}

describe('landmark smoothing', () => {
  it('moves each landmark partway toward the new measurement', () => {
    const previous = [point('left_knee', 0.5, 0.5)];
    const current = [point('left_knee', 0.6, 0.6)];
    const smoothed = smoothLandmarks(previous, current, 0.5);
    expect(smoothed[0].x).toBeCloseTo(0.55, 5);
    expect(smoothed[0].y).toBeCloseTo(0.55, 5);
  });

  it('drops landmarks missing from the current frame', () => {
    const previous = [point('left_knee', 0.5, 0.5)];
    const smoothed = smoothLandmarks(previous, [], 0.5);
    expect(smoothed).toEqual([]);
  });

  it('converges to a stationary target instead of diverging', () => {
    let current = [point('left_knee', 0.9, 0.9)];
    for (let i = 0; i < 50; i += 1) {
      current = smoothLandmarks([point('left_knee', 0.9, 0.9)], current, 0.5);
    }
    expect(current[0].x).toBeCloseTo(0.9, 5);
    expect(current[0].y).toBeCloseTo(0.9, 5);
  });

  it('reports only meaningful movement', () => {
    const a = [point('left_knee', 0.5, 0.5)];
    expect(keypointsMoved(a, [point('left_knee', 0.5, 0.5)], 0.006)).toBe(false);
    expect(keypointsMoved(a, [point('left_knee', 0.51, 0.5)], 0.006)).toBe(true);
  });

  it('holds a briefly missing landmark then releases it', () => {
    const previous = [point('left_knee', 0.5, 0.5)];
    const lastSeen = new Map<string, number>([['left_knee', 0]]);
    const held = smoothWithHold(
      previous,
      [],
      0.72,
      0.1,
      300,
      200,
      lastSeen
    );
    expect(held).toHaveLength(1);
    const released = smoothWithHold(
      previous,
      [],
      0.72,
      0.1,
      300,
      400,
      lastSeen
    );
    expect(released).toEqual([]);
  });

  it('snaps fast when a landmark teleports between frames', () => {
    const previous = [point('left_shoulder', 0.5, 0.5)];
    const lastSeen = new Map<string, number>();
    const snapped = smoothWithHold(
      previous,
      [point('left_shoulder', 0.8, 0.5)],
      0.5,
      0.1,
      300,
      100,
      lastSeen
    );
    expect(snapped[0].x).toBeCloseTo(0.785, 3);
  });
});

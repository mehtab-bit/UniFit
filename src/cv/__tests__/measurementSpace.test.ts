import { describe, expect, it } from 'vitest';
import { toMeasurementKeypoints } from '../measurementSpace';
import { angleAtPoint } from '../math';

describe('measurement space', () => {
  it('preserves keypoint names/scores while scaling coordinates', () => {
    const keypoints = [
      { name: 'right_hip' as const, x: 0.5, y: 0.4, score: 0.9 },
    ];
    const scaled = toMeasurementKeypoints(keypoints, {
      width: 1920,
      height: 1080,
    });
    expect(scaled[0].x).toBe(960);
    expect(scaled[0].y).toBe(432);
    expect(scaled[0].score).toBe(0.9);
  });

  it('changes angles for nonsquare sources and preserves square-source angles', () => {
    const first = { name: 'right_shoulder' as const, x: 0.9, y: 0.1, score: 1 };
    const center = { name: 'right_elbow' as const, x: 0.5, y: 0.5, score: 1 };
    const third = { name: 'right_wrist' as const, x: 0.9, y: 0.9, score: 1 };

    const normalizedAngle = angleAtPoint(first, center, third);
    const squareMeasurement = toMeasurementKeypoints(
      [first, center, third],
      { width: 192, height: 192 }
    );
    const squareAngle = angleAtPoint(
      squareMeasurement[0],
      squareMeasurement[1],
      squareMeasurement[2]
    );
    expect(squareAngle).toBeCloseTo(normalizedAngle, 1);

    const wideMeasurement = toMeasurementKeypoints(
      [first, center, third],
      { width: 1920, height: 1080 }
    );
    const wideAngle = angleAtPoint(
      wideMeasurement[0],
      wideMeasurement[1],
      wideMeasurement[2]
    );
    expect(wideAngle).not.toBeCloseTo(normalizedAngle, 1);
  });
});

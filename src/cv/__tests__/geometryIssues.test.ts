import { describe, expect, it } from 'vitest';
import { assessGeometryIssues } from '../geometryIssues';
import { CvKeypoint } from '../types';

function point(name: CvKeypoint['name'], x: number, y: number): CvKeypoint {
  return { name, x, y, score: 0.95 };
}

describe('assessGeometryIssues', () => {
  it('flags excessive torso lean during a squat', () => {
    const issues = assessGeometryIssues(
      'squat',
      [
        point('right_shoulder', 0.9, 0.2),
        point('right_hip', 0.3, 0.55),
        point('right_knee', 0.3, 0.8),
        point('right_ankle', 0.3, 0.95)
      ],
      'right'
    );
    expect(issues.some((issue) => issue.code === 'torso_lean')).toBe(true);
  });

  it('does not flag an upright squat', () => {
    const issues = assessGeometryIssues(
      'squat',
      [
        point('right_shoulder', 0.3, 0.2),
        point('right_hip', 0.3, 0.55),
        point('right_knee', 0.3, 0.8),
        point('right_ankle', 0.3, 0.95)
      ],
      'right'
    );
    expect(issues).toHaveLength(0);
  });

  it('flags hip drop in a push-up', () => {
    const issues = assessGeometryIssues(
      'pushup',
      [
        point('right_shoulder', 0.2, 0.35),
        point('right_hip', 0.35, 0.55),
        point('right_knee', 0.2, 0.72),
        point('right_ankle', 0.2, 0.9)
      ],
      'right'
    );
    expect(issues.some((issue) => issue.code === 'hip_drop')).toBe(true);
  });
});

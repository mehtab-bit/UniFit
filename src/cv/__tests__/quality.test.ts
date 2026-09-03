import { describe, expect, it } from 'vitest';
import { exerciseDefinitions } from '../exercises';
import { assessQuality } from '../quality';
import { isRepTooFast } from '../tempo';
import { CvKeypoint } from '../types';

function point(name: CvKeypoint['name'], x: number, y: number): CvKeypoint {
  return { name, x, y, score: 0.95 };
}

describe('five-family exercise definitions', () => {
  it.each(['squat', 'lunge'] as const)('measures %s with hip-knee-ankle', (id) => {
    const angle = exerciseDefinitions[id].getAngle(
      [
        point('right_hip', 0, 0),
        point('right_knee', 0, 1),
        point('right_ankle', 1, 1)
      ],
      'right'
    );
    expect(angle).toBe(90);
  });

  it.each(['pushup', 'bicep_curl', 'supported_row'] as const)(
    'measures %s with shoulder-elbow-wrist',
    (id) => {
      const angle = exerciseDefinitions[id].getAngle(
        [
          point('right_shoulder', 0, 0),
          point('right_elbow', 1, 0),
          point('right_wrist', 1, 1)
        ],
        'right'
      );
      expect(angle).toBe(90);
    }
  );
});

describe('form quality', () => {
  it('flags elbow drift for a curl with the elbow far from the shoulder line', () => {
    const result = assessQuality(
      'bicep_curl',
      [
        point('right_shoulder', 0, 0),
        point('right_elbow', 0.5, 0.8),
        point('right_wrist', 1, 0)
      ],
      'right',
      90
    );
    expect(result.score).toBeLessThan(100);
    expect(result.correction).toContain('elbows pinned');
  });

  it('keeps full score when only the primary angle is available', () => {
    const result = assessQuality(
      'bicep_curl',
      [
        point('right_shoulder', 0, 0),
        point('right_elbow', 0.2, 0),
        point('right_wrist', 1, 0)
      ],
      'right',
      90
    );
    expect(result.score).toBe(100);
  });
});

describe('tempo', () => {
  it('flags fast reps and accepts controlled reps', () => {
    expect(isRepTooFast(450)).toBe(true);
    expect(isRepTooFast(1400)).toBe(false);
  });
});

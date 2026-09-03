import { describe, expect, it } from 'vitest';
import { captureCalibrationAngle, createCalibration } from '../calibration';
import { exerciseDefinitions } from '../exercises';
import { getFeedbackState } from '../feedback';
import { angleAtPoint, smoothAngle } from '../math';
import { createRepCounterState, updateRepCounter } from '../repCounter';
import { CvKeypoint } from '../types';

function point(name: CvKeypoint['name'], x: number, y: number): CvKeypoint {
  return {
    name,
    x,
    y,
    score: 0.9
  };
}

describe('CV math', () => {
  it('calculates the angle at the center keypoint', () => {
    const angle = angleAtPoint(
      point('right_shoulder', 0, 0),
      point('right_elbow', 1, 0),
      point('right_wrist', 1, 1)
    );

    expect(angle).toBe(90);
  });

  it('smooths only recent valid angle values', () => {
    const angle = smoothAngle([10, null, 20, 30, 40, 50], 3);

    expect(angle).toBe(40);
  });
});

describe('exercise definitions', () => {
  it('calculates bicep curl elbow angle from shoulder elbow and wrist', () => {
    const angle = exerciseDefinitions.bicep_curl.getAngle(
      [
        point('right_shoulder', 0, 0),
        point('right_elbow', 1, 0),
        point('right_wrist', 1, 1)
      ],
      'right'
    );

    expect(angle).toBe(90);
  });

  it('calculates squat knee angle from hip knee and ankle', () => {
    const angle = exerciseDefinitions.squat.getAngle(
      [
        point('right_hip', 0, 0),
        point('right_knee', 0, 1),
        point('right_ankle', 1, 1)
      ],
      'right'
    );

    expect(angle).toBe(90);
  });
});

describe('calibration', () => {
  it('captures a stable calibration angle', () => {
    const angle = captureCalibrationAngle([88, 90, 91, 89, 90]);

    expect(angle).toBe(89.6);
  });

  it('rejects unstable calibration samples', () => {
    const angle = captureCalibrationAngle([70, 91, 120, 88, 90]);

    expect(angle).toBeNull();
  });
});

describe('feedback', () => {
  it('asks the user to move up before reaching the end position', () => {
    const feedback = getFeedbackState(45, createCalibration(0, 100), 'up');

    expect(feedback).toBe('move_up');
  });

  it('accepts movement near the target position', () => {
    const feedback = getFeedbackState(85, createCalibration(0, 100), 'up');

    expect(feedback).toBe('good');
  });
});

describe('rep counter', () => {
  it('counts one full start to end to start cycle', () => {
    const calibration = createCalibration(160, 60);
    let state = createRepCounterState();

    state = updateRepCounter(state, 150, calibration);
    state = updateRepCounter(state, 60, calibration);
    state = updateRepCounter(state, 100, calibration);
    state = updateRepCounter(state, 160, calibration);

    expect(state.reps).toBe(1);
  });

  it('does not double-count while hovering near the middle', () => {
    const calibration = createCalibration(160, 60);
    let state = createRepCounterState();

    state = updateRepCounter(state, 60, calibration);
    state = updateRepCounter(state, 110, calibration);
    state = updateRepCounter(state, 100, calibration);
    state = updateRepCounter(state, 105, calibration);

    expect(state.reps).toBe(0);
  });
});

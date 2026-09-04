import { describe, expect, it } from 'vitest';
import { buildSessionPlan, isBilateralExercise } from '../sessionPlan';

describe('sessionPlan', () => {
  it('treats total_reps exercises as one side with sets x reps total', () => {
    expect(buildSessionPlan({ family: 'squat', sets: 2, reps: 8, repMode: 'total_reps' }))
      .toEqual({
        bilateral: false,
        repsPerSet: 8,
        setsPerSide: 2,
        repsPerSide: 16,
        totalReps: 16
      });
  });

  it('doubles bilateral prescriptions across sides', () => {
    const plan = buildSessionPlan({
      family: 'bicep_curl',
      sets: 2,
      reps: 8,
      repMode: 'reps_each_arm'
    });
    expect(plan).toEqual({
      bilateral: true,
      repsPerSet: 8,
      setsPerSide: 2,
      repsPerSide: 16,
      totalReps: 32
    });
  });

  it('falls back to the family list when rep mode is missing', () => {
    expect(isBilateralExercise('lunge')).toBe(true);
    expect(isBilateralExercise('pushup')).toBe(false);
    expect(buildSessionPlan({ family: 'supported_row', sets: 3, reps: 10 }).bilateral)
      .toBe(true);
  });

  it('never produces a zero or nonsense plan', () => {
    const plan = buildSessionPlan({ sets: 0, reps: 0 });
    expect(plan.repsPerSet).toBeGreaterThanOrEqual(1);
    expect(plan.totalReps).toBeGreaterThanOrEqual(1);
  });
});

import { describe, expect, it } from 'vitest';
import { resolveProgressionWeek } from '../../../utils/progressionWeek';

describe('resolveProgressionWeek', () => {
  it('keeps plain numbers', () => {
    expect(resolveProgressionWeek(2)).toBe(2);
    expect(resolveProgressionWeek(undefined)).toBeUndefined();
  });

  it('prefers the strength week from a per-activity map', () => {
    expect(
      resolveProgressionWeek({ strength: 3, running: 1, cycling: 2 })
    ).toBe(3);
  });

  it('uses the highest activity week when strength is absent', () => {
    expect(resolveProgressionWeek({ running: 1, cycling: 4 })).toBe(4);
  });

  it('never renders an object as a child', () => {
    expect(typeof resolveProgressionWeek({ strength: 1 })).toBe('number');
  });
});

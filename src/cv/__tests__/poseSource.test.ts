import { describe, expect, it } from 'vitest';
import {
  normalizePoseSourceOverride,
  resolvePoseSourceMode
} from '../poseSource';

describe('pose source helpers', () => {
  it('normalizes only known persisted values', () => {
    expect(normalizePoseSourceOverride('mediapipe')).toBe('mediapipe');
    expect(normalizePoseSourceOverride('movenet')).toBe('movenet');
    expect(normalizePoseSourceOverride('auto')).toBe('auto');
    expect(normalizePoseSourceOverride('garbage')).toBe('auto');
    expect(normalizePoseSourceOverride(null)).toBe('auto');
  });

  it('falls back to MoveNet when MediaPipe is unavailable', () => {
    expect(resolvePoseSourceMode('mediapipe', false)).toBe('movenet');
    expect(resolvePoseSourceMode('auto', false)).toBe('movenet');
    expect(resolvePoseSourceMode('mediapipe', true)).toBe('mediapipe');
    expect(resolvePoseSourceMode('movenet', true)).toBe('movenet');
    expect(resolvePoseSourceMode('auto', true)).toBe('mediapipe');
  });
});

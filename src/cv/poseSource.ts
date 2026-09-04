/**
 * Pure pose-engine selection helpers, kept free of React Native imports so
 * they can be unit-tested.
 */
export type PoseSourceMode = 'movenet' | 'mediapipe';
export type PoseSourceOverride = 'auto' | PoseSourceMode;

export function normalizePoseSourceOverride(
  raw: string | null | undefined
): PoseSourceOverride {
  if (raw === 'movenet' || raw === 'mediapipe') {
    return raw;
  }
  return 'auto';
}

/**
 * Resolves the effective engine. A MediaPipe preference only wins when the
 * native plugin is actually present; otherwise we fall back to MoveNet so
 * Expo Go / unsupported builds never crash.
 */
export function resolvePoseSourceMode(
  override: PoseSourceOverride,
  nativeAvailable: boolean
): PoseSourceMode {
  if (override === 'mediapipe' && nativeAvailable) {
    return 'mediapipe';
  }
  if (override === 'movenet') {
    return 'movenet';
  }
  return nativeAvailable ? 'mediapipe' : 'movenet';
}

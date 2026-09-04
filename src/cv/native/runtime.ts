import { Platform } from 'react-native';
import { SafeStorage } from '../../../lib/supabase';

export type PoseSourceMode = 'movenet' | 'mediapipe';
export type PoseSourceOverride = 'auto' | PoseSourceMode;

const POSE_SOURCE_STORAGE_KEY = '@unifit_pose_source_v1';

let nativeAvailable: boolean | null = null;
let sourceOverride: PoseSourceOverride = 'auto';

/**
 * True when the native Vision Camera + MediaPipe modules are present in this
 * build (development build), false in Expo Go or on unsupported platforms.
 * Modules are required lazily so Expo Go never evaluates them.
 */
export function isNativePoseAvailable(): boolean {
  if (Platform.OS !== 'android') {
    return false;
  }
  if (nativeAvailable !== null) {
    return nativeAvailable;
  }
  try {
    // Requiring these is what registers the worklet/native bindings; in Expo
    // Go one of them throws and we fall back to MoveNet.
    require('react-native-vision-camera');
    require('react-native-worklets-core');
    nativeAvailable = true;
  } catch {
    nativeAvailable = false;
  }
  return nativeAvailable;
}

export function getPoseSourceOverride(): PoseSourceOverride {
  return sourceOverride;
}

export function setPoseSourceOverride(next: PoseSourceOverride) {
  sourceOverride = next;
}

/**
 * Persists the user's pose-engine preference (Auto / MediaPipe / MoveNet)
 * and applies it for the rest of the process.
 */
export async function savePoseSourceOverride(
  next: PoseSourceOverride
): Promise<void> {
  setPoseSourceOverride(next);
  await SafeStorage.setItem(POSE_SOURCE_STORAGE_KEY, next);
}

/**
 * Loads the saved pose-engine preference into the runtime override. Call
 * once before resolving the pose source (e.g. when a camera screen mounts).
 */
export async function loadPoseSourceOverride(): Promise<PoseSourceOverride> {
  try {
    const raw = await SafeStorage.getItem(POSE_SOURCE_STORAGE_KEY);
    if (
      raw === 'auto' ||
      raw === 'movenet' ||
      raw === 'mediapipe'
    ) {
      sourceOverride = raw;
      return raw;
    }
  } catch {
    // Ignore storage failures and fall back to auto.
  }
  sourceOverride = 'auto';
  return 'auto';
}

export function resolvePoseSourceMode(): PoseSourceMode {
  if (sourceOverride === 'mediapipe' && isNativePoseAvailable()) {
    return 'mediapipe';
  }
  if (sourceOverride === 'movenet') {
    return 'movenet';
  }
  // Auto (and a MediaPipe override on builds without the native plugin):
  // fall back to MoveNet so Expo Go never crashes trying to load the
  // Vision Camera feed.
  return isNativePoseAvailable() ? 'mediapipe' : 'movenet';
}

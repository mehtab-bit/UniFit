import { Platform } from 'react-native';

export type PoseSourceMode = 'movenet' | 'mediapipe';
export type PoseSourceOverride = 'auto' | PoseSourceMode;

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

export function resolvePoseSourceMode(): PoseSourceMode {
  if (sourceOverride !== 'auto') {
    return sourceOverride;
  }
  return isNativePoseAvailable() ? 'mediapipe' : 'movenet';
}

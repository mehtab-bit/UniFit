import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
  VisionCameraProxy
} from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';
import type { HandDetectionResult } from 'expo-vision-camera-v4-mediapipe';
import { CameraType } from 'expo-camera';
import { NativePoseFrame } from '../nativePose';

type NativeCameraFeedProps = {
  facing: CameraType;
  onDetected: (frame: NativePoseFrame) => void;
  onError: (error: Error) => void;
};

/**
 * Vision Camera v4 + MediaPipe PoseLandmarker feed. Inference runs natively on
 * every camera frame; results are bridged to JS, smoothed, and throttled in
 * usePoseDetection so the UI thread stays free.
 */
export function NativeCameraFeed({
  facing,
  onDetected,
  onError
}: NativeCameraFeedProps) {
  const device = useCameraDevice(facing === 'back' ? 'back' : 'front');
  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    if (!hasPermission) {
      void requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const plugin = useMemo(
    () => VisionCameraProxy.initFrameProcessorPlugin('handLandmarker', {}),
    []
  );

  useEffect(() => {
    if (!plugin) {
      onError(new Error('Native MediaPipe plugin is unavailable in this build.'));
    }
    if (!device) {
      onError(new Error('No matching camera device found.'));
    }
  }, [device, onError, plugin]);

  const onDetectedOnJS = useMemo(
    () => Worklets.createRunOnJS((result: HandDetectionResult) => {
      onDetected({
        pose: result.pose,
        imageWidth: result.imageWidth,
        imageHeight: result.imageHeight,
        error: result.error
      });
    }),
    [onDetected]
  );

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      if (plugin == null) return;
      const result = plugin.call(frame) as HandDetectionResult | undefined;
      if (result) {
        onDetectedOnJS(result);
      }
    },
    [onDetectedOnJS, plugin]
  );

  if (!device || !hasPermission) {
    return null;
  }

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive
      pixelFormat="rgb"
      frameProcessor={frameProcessor}
    />
  );
}

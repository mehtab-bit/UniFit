import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
  VisionCameraProxy
} from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';
import type { HandDetectionResult } from 'expo-vision-camera-v4-mediapipe';
import { nativePoseToCvKeypoints } from '../nativePose';
import { CvKeypoint } from '../types';

/**
 * Standalone native pose debug screen. Kept behind a lazy route so Expo Go /
 * MoveNet builds never evaluate the Vision Camera modules.
 */
export default function NativePoseDebugView() {
  const router = useRouter();
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [keypoints, setKeypoints] = useState<CvKeypoint[]>([]);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });
  const [mirrorPreview, setMirrorPreview] = useState(true);
  const [poseFps, setPoseFps] = useState(0);
  const [frameFps, setFrameFps] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const stateRef = useRef({
    poseCount: 0,
    frameCount: 0,
    secondStart: Date.now(),
    lastPoseUpdate: 0
  });

  const handLandmarkerPlugin = useMemo(
    () => VisionCameraProxy.initFrameProcessorPlugin('handLandmarker', {}),
    []
  );

  if (handLandmarkerPlugin == null) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerTitle}>handLandmarker plugin not found</Text>
        <Text style={styles.error}>
          Check that the native build registered the frame processor plugin.
        </Text>
      </View>
    );
  }

  const onDetected = useMemo(
    () =>
      Worklets.createRunOnJS((result: HandDetectionResult) => {
        const now = Date.now();
        const snapshot = stateRef.current;
        snapshot.frameCount += 1;
        if (result.error) {
          setLastError(result.error);
        }
        if (result.pose && result.pose.length > 0) {
          snapshot.poseCount += 1;
          if (now - snapshot.lastPoseUpdate >= 120) {
            snapshot.lastPoseUpdate = now;
            setKeypoints(nativePoseToCvKeypoints(result.pose));
            setImageSize({
              width: result.imageWidth ?? 0,
              height: result.imageHeight ?? 0
            });
          }
        }
        if (now - snapshot.secondStart >= 1000) {
          const elapsed = (now - snapshot.secondStart) / 1000;
          setFrameFps(Math.round(snapshot.frameCount / elapsed));
          setPoseFps(Math.round(snapshot.poseCount / elapsed));
          snapshot.frameCount = 0;
          snapshot.poseCount = 0;
          snapshot.secondStart = now;
        }
      }),
    []
  );

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      const result = handLandmarkerPlugin.call(frame) as
        | HandDetectionResult
        | undefined;
      if (result) {
        onDetected(result);
      }
    },
    [handLandmarkerPlugin, onDetected]
  );

  const overlayPoints = useMemo(() => {
    if (
      keypoints.length === 0 ||
      cameraLayout.width === 0 ||
      cameraLayout.height === 0 ||
      imageSize.width === 0 ||
      imageSize.height === 0
    ) {
      return [];
    }
    const scale = Math.max(
      cameraLayout.width / imageSize.width,
      cameraLayout.height / imageSize.height
    );
    const drawWidth = imageSize.width * scale;
    const drawHeight = imageSize.height * scale;
    const offsetX = (cameraLayout.width - drawWidth) / 2;
    const offsetY = (cameraLayout.height - drawHeight) / 2;
    const DOT = 12;

    return keypoints.map((point) => {
      const xFraction = mirrorPreview ? 1 - point.x : point.x;
      return {
        key: point.name,
        left: offsetX + xFraction * drawWidth - DOT / 2,
        top: offsetY + point.y * drawHeight - DOT / 2
      };
    });
  }, [cameraLayout, imageSize, keypoints, mirrorPreview]);

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerTitle}>Camera permission needed</Text>
        <Text style={styles.centerButton} onPress={() => requestPermission()}>
          Grant camera permission
        </Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerTitle}>No camera device found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerText} onPress={() => router.back()}>
          ← Exit
        </Text>
        <Text style={styles.headerTitle}>MediaPipe Native Test</Text>
        <Text style={styles.headerSpacer} />
      </View>

      <View
        style={styles.cameraWrap}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setCameraLayout({ width, height });
        }}
      >
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive
          pixelFormat="rgb"
          frameProcessor={frameProcessor}
        />
        {overlayPoints.map((point) => (
          <View
            key={point.key}
            pointerEvents="none"
            style={[styles.dot, { left: point.left, top: point.top }]}
          />
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.stat} onPress={() => setMirrorPreview((v) => !v)}>
          Mirror overlay: {mirrorPreview ? 'ON (front cam)' : 'OFF'} — tap to
          flip
        </Text>
        <Text style={styles.stat}>
          Tracked joints: {keypoints.length} · Frame {imageSize.width}×
          {imageSize.height}
        </Text>
        <Text style={styles.stat}>Pose detections: {poseFps} fps</Text>
        <Text style={styles.stat}>Frame callbacks: {frameFps} fps</Text>
        <Text style={styles.hint}>
          Stand far enough back that your full torso and limbs are visible.
        </Text>
        {lastError ? <Text style={styles.error}>{lastError}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b1220' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0b1220'
  },
  headerText: { color: '#7dd3fc', fontSize: 15, fontWeight: '800' },
  headerTitle: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  headerSpacer: { width: 40 },
  cameraWrap: {
    flex: 1,
    backgroundColor: '#000000',
    overflow: 'hidden'
  },
  dot: {
    position: 'absolute',
    width: 12,
    height: 12,
    marginLeft: -6,
    marginTop: -6,
    borderRadius: 6,
    backgroundColor: '#22d3ee'
  },
  panel: {
    padding: 16,
    gap: 6,
    backgroundColor: '#0f172a'
  },
  stat: { color: '#e2e8f0', fontSize: 14, fontWeight: '700' },
  hint: { color: '#94a3b8', fontSize: 12, lineHeight: 17 },
  error: { color: '#f87171', fontSize: 12 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b1220',
    gap: 12
  },
  centerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  centerButton: { color: '#7dd3fc', fontSize: 15, fontWeight: '700' }
});

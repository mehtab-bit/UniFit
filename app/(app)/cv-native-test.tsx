import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor
} from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';
import type { Frame } from 'react-native-vision-camera';
import type { HandDetectionResult } from 'expo-vision-camera-v4-mediapipe';
import { nativePoseToCvKeypoints } from '../../src/cv/nativePose';
import { CvKeypoint } from '../../src/cv/types';

// detectHandLandmarks is injected by the native config plugin as a global
// available inside frame-processor worklets.
declare global {
  function detectHandLandmarks(frame: Frame): HandDetectionResult;
}

export default function NativePoseTestScreen() {
  const router = useRouter();
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [keypoints, setKeypoints] = useState<CvKeypoint[]>([]);
  const [poseFps, setPoseFps] = useState(0);
  const [frameFps, setFrameFps] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const stateRef = useRef({
    poseCount: 0,
    frameCount: 0,
    secondStart: Date.now(),
    lastPoseUpdate: 0
  });

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
      const result = detectHandLandmarks(frame);
      if (result) {
        onDetected(result);
      }
    },
    [onDetected]
  );

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

  const visibleCount = keypoints.length;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerText} onPress={() => router.back()}>
          ← Exit
        </Text>
        <Text style={styles.headerTitle}>MediaPipe Native Test</Text>
        <Text style={styles.headerSpacer} />
      </View>

      <View style={styles.cameraWrap}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive
          pixelFormat="rgb"
          frameProcessor={frameProcessor}
        />
        {keypoints.map((point) => (
          <View
            key={point.name}
            pointerEvents="none"
            style={[
              styles.dot,
              {
                left: `${point.x * 100}%`,
                top: `${point.y * 100}%`
              }
            ]}
          />
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.stat}>
          Tracked joints: {visibleCount}
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

import { useCallback, useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native/dist/platform_react_native';
import { CameraType, useCameraPermissions } from 'expo-camera';
import { ExpoWebGLRenderingContext } from 'expo-gl';
import { load as loadMoveNet } from '@tensorflow-models/pose-detection/dist/movenet/detector';
import { SINGLEPOSE_LIGHTNING } from '@tensorflow-models/pose-detection/dist/movenet/constants';
import { PoseDetector } from '@tensorflow-models/pose-detection/dist/pose_detector';
import { normalizeKeypoints } from './keypoints';
import { shouldMirrorPreview } from './TensorCamera';
import { CvKeypoint, KeypointName } from './types';
import { createBundledModelIO } from './modelAssets';

// Bundled model keeps CV usable offline and avoids a long first-load fetch.
const movenetModelJson = require('../../assets/models/movenet-lightning/model.json');
const movenetWeights1 = require('../../assets/models/movenet-lightning/group1-shard1of2.bin');
const movenetWeights2 = require('../../assets/models/movenet-lightning/group1-shard2of2.bin');

export { TensorCamera } from './TensorCamera';

type ModelStatus = 'loading' | 'ready' | 'error';

type SourceSize = {
  width: number;
  height: number;
};

type FrameImages = IterableIterator<tf.Tensor3D>;

const DETECTION_INTERVAL_MS = 180;
const DEFAULT_FACING: CameraType = 'front';

/**
 * Live pose pipeline: loads MoveNet once, then runs inference on camera
 * frames at a fixed rate. Keeps the hook purely about detection so the rest
 * of the app only has to read keypoints/model status.
 */
export function usePoseDetection(facing: CameraType = DEFAULT_FACING) {
  const [permission, requestPermission] = useCameraPermissions();
  const [modelStatus, setModelStatus] = useState<ModelStatus>('loading');
  const [keypoints, setKeypoints] = useState<CvKeypoint[]>([]);
  const [visibleKeypointNames, setVisibleKeypointNames] = useState<KeypointName[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [framesProcessed, setFramesProcessed] = useState(0);
  const [lastDetectionAt, setLastDetectionAt] = useState<number | null>(null);
  const [sourceSize, setSourceSize] = useState<SourceSize | null>(null);

  const detectorRef = useRef<PoseDetector | null>(null);
  const lastKeypointsRef = useRef<CvKeypoint[]>([]);
  const smoothedKeypointsRef = useRef<CvKeypoint[]>([]);
  const lastVisibleRef = useRef<KeypointName[]>([]);
  const lastSourceRef = useRef<SourceSize | null>(null);
  const isActiveRef = useRef(true);
  const isDetectingRef = useRef(false);
  const lastDetectionAtRef = useRef(0);

  const mirrorX = shouldMirrorPreview(facing === 'front');

  useEffect(() => {
    isActiveRef.current = true;

    async function loadModel() {
      try {
        await tf.ready();
        await tf.setBackend('rn-webgl');
        const modelIO = await createBundledModelIO(movenetModelJson, [
          movenetWeights1,
          movenetWeights2
        ]);
        const detector = await loadMoveNet({
          modelType: SINGLEPOSE_LIGHTNING,
          modelUrl: modelIO
        });

        if (isActiveRef.current) {
          detectorRef.current = detector;
          setModelStatus('ready');
          setError(null);
        }
      } catch (loadError) {
        if (isActiveRef.current) {
          setModelStatus('error');
          setError(loadError instanceof Error ? loadError.message : 'MoveNet failed to load.');
        }
      }
    }

    loadModel();

    return () => {
      isActiveRef.current = false;
      detectorRef.current?.dispose();
      detectorRef.current = null;
    };
  }, []);

  const handleCameraStream = useCallback(
    (images: FrameImages, _updateCameraPreview: () => void, _gl: ExpoWebGLRenderingContext) => {
      async function processFrame() {
        if (!isActiveRef.current) {
          return;
        }

        const now = Date.now();
        const shouldDetect =
          detectorRef.current !== null &&
          now - lastDetectionAtRef.current >= DETECTION_INTERVAL_MS &&
          !isDetectingRef.current;

        if (shouldDetect) {
          isDetectingRef.current = true;
          lastDetectionAtRef.current = now;

          const imageTensor = images.next().value;

          if (imageTensor) {
            try {
              const poses = await detectorRef.current?.estimatePoses(imageTensor);
              const pose = poses?.[0];

              if (isActiveRef.current) {
                setFramesProcessed((currentCount) => currentCount + 1);
                if (pose && pose.keypoints.length > 0) {
                  const detectedKeypoints = normalizeKeypoints(pose.keypoints);
                  const smoothed = smoothKeypoints(
                    smoothedKeypointsRef.current,
                    detectedKeypoints,
                    0.55
                  );
                  smoothedKeypointsRef.current = smoothed;
                  const visible = detectedKeypoints
                    .filter((keypoint) => typeof keypoint.score !== 'number' || keypoint.score >= 0.35)
                    .map((keypoint) => keypoint.name);
                  if (keypointsChanged(lastKeypointsRef.current, smoothed, 0.015)) {
                    lastKeypointsRef.current = smoothed;
                    setKeypoints(smoothed);
                  }
                  if (lastVisibleRef.current.join() !== visible.join()) {
                    lastVisibleRef.current = visible;
                    setVisibleKeypointNames(visible);
                  }
                } else {
                  if (lastKeypointsRef.current.length > 0) {
                    lastKeypointsRef.current = [];
                    setKeypoints([]);
                  }
                  if (lastVisibleRef.current.length > 0) {
                    lastVisibleRef.current = [];
                    setVisibleKeypointNames([]);
                  }
                }

                const nextSource = {
                  width: imageTensor.shape[1],
                  height: imageTensor.shape[0]
                };
                if (
                  !lastSourceRef.current ||
                  lastSourceRef.current.width !== nextSource.width ||
                  lastSourceRef.current.height !== nextSource.height
                ) {
                  lastSourceRef.current = nextSource;
                  setSourceSize(nextSource);
                }
                setError(null);
              }
            } catch (detectError) {
              if (isActiveRef.current) {
                setError(
                  detectError instanceof Error
                    ? detectError.message
                    : 'Pose detection failed.'
                );
              }
            } finally {
              tf.dispose(imageTensor);
              isDetectingRef.current = false;

            }
          }
        }

        if (isActiveRef.current) {
          requestAnimationFrame(processFrame);
        }
      }

      processFrame();
    },
    []
  );

  const handleCameraError = useCallback((cameraError: Error) => {
    setError(cameraError.message);
  }, []);

  return {
    permission,
    requestPermission,
    modelStatus,
    keypoints,
    visibleKeypointNames,
    error,
    isDetecting,
    framesProcessed,
    lastDetectionAt,
    sourceSize,
    mirrorX,
    facing,
    handleCameraStream,
    handleCameraError
  };
}

function keypointsChanged(a: CvKeypoint[], b: CvKeypoint[], threshold = 0.001) {
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; i++) {
    const ka = a[i];
    const kb = b[i];
    if (
      ka.name !== kb.name ||
      Math.abs(ka.x - kb.x) > threshold ||
      Math.abs(ka.y - kb.y) > threshold ||
      (ka.score ?? 0) !== (kb.score ?? 0)
    ) {
      return true;
    }
  }
  return false;
}

function smoothKeypoints(
  previous: CvKeypoint[],
  current: CvKeypoint[],
  alpha: number
): CvKeypoint[] {
  if (previous.length !== current.length) {
    return current;
  }
  const previousMap = new Map(previous.map((keypoint) => [keypoint.name, keypoint]));
  return current.map((keypoint) => {
    const last = previousMap.get(keypoint.name);
    if (!last) return keypoint;
    return {
      ...keypoint,
      x: last.x + (keypoint.x - last.x) * alpha,
      y: last.y + (keypoint.y - last.y) * alpha
    };
  });
}

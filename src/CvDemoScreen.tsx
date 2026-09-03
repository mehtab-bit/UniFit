import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { CameraType } from 'expo-camera';
import { TensorCamera } from './cv/TensorCamera';
import { usePoseDetection } from './cv/usePoseDetection';
import { useExerciseTracker } from './cv/useExerciseTracker';
import { ExerciseId, Side } from './cv/types';
import { assessQuality } from './cv/quality';
import { isRepTooFast } from './cv/tempo';
import { SkeletonOverlay } from './cv/SkeletonOverlay';
import { useAccessibility } from '../context/AccessibilityContext';

type CalibrationStage = 'idle' | 'start_hold' | 'end_move' | 'end_hold' | 'complete' | 'failed';

const exerciseOptions: ExerciseId[] = ['squat', 'lunge', 'pushup', 'bicep_curl', 'supported_row'];

const exerciseLabels: Record<ExerciseId, string> = {
  squat: 'Squat',
  lunge: 'Lunge',
  pushup: 'Push-up',
  bicep_curl: 'Curl',
  supported_row: 'Row'
};

const stageDetails: Record<
  CalibrationStage,
  { label: string; hint: (tracker: ReturnType<typeof useExerciseTracker>) => string }
> = {
  idle: {
    label: 'Ready',
    hint: () => 'Tap Calibrate, then follow the prompts. No more taps needed.'
  },
  start_hold: {
    label: 'Hold the start position',
    hint: (tracker) => `${tracker.definition.startCalibrationLabel} Hold still to auto-capture.`
  },
  end_move: {
    label: 'Move to the end position',
    hint: (tracker) => `${tracker.definition.endCalibrationLabel} Pause there to auto-capture.`
  },
  end_hold: {
    label: 'Hold the end position',
    hint: () => 'Keep it steady — auto-capturing.'
  },
  complete: {
    label: 'Calibrated',
    hint: () => 'Now do full reps. Watch the dots follow your body.'
  },
  failed: {
    label: 'Not steady',
    hint: () => 'Not enough stable frames. Tap Recalibrate and hold still.'
  }
};

const feedbackLabels: Record<string, string> = {
  not_visible: 'Move into view',
  needs_calibration: 'Calibrate to start',
  get_ready: 'Get ready',
  move_up: 'Lift higher',
  move_down: 'Lower slowly',
  good: 'Good form',
  too_fast: 'Slow down'
};

// TensorFlow draws the camera feed over the full camera view, so the view has
// to match the feed's own shape or the picture gets stretched. These are the
// feed shapes TensorFlow's example found undistorted in portrait: 16:9 iPhone,
// 4:3 Android.
const CAMERA_HEIGHT_RATIO = Platform.OS === 'ios' ? 16 / 9 : 4 / 3;

function jointLabel(name: string) {
  return name.replace('right_', '').replace('left_', '').replace(/_/g, ' ');
}

type CvDemoScreenProps = {
  exerciseId: ExerciseId;
  onExerciseChange?: (exerciseId: ExerciseId) => void;
  onExit?: () => void;
  facing?: CameraType;
  showExerciseSwitcher?: boolean;
  targetReps?: number;
  bilateral?: boolean;
  sideOverride?: Side;
  onSessionComplete?: (result: { reps: number; score: number; correction?: string }) => void;
};

export function CvDemoScreen({
  exerciseId,
  onExerciseChange,
  onExit,
  facing = 'front',
  showExerciseSwitcher = true,
  targetReps,
  bilateral = false,
  sideOverride,
  onSessionComplete
}: CvDemoScreenProps) {
  const [calibrationStage, setCalibrationStage] = useState<CalibrationStage>('idle');
  const [countdown, setCountdown] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<CameraType>(facing);
  const { width: windowWidth } = useWindowDimensions();
  const { provideFeedback } = useAccessibility();

  const cameraSize = {
    width: windowWidth,
    height: windowWidth * CAMERA_HEIGHT_RATIO
  };

  const pose = usePoseDetection(cameraFacing);
  const tracker = useExerciseTracker(exerciseId, pose.keypoints, sideOverride);
  const trackerRef = useRef(tracker);
  const previousRepsRef = useRef(0);
  const lastRepAtRef = useRef(0);
  const sessionEndedRef = useRef(false);
  const accessibilityRef = useRef(provideFeedback);
  const onCompleteRef = useRef(onSessionComplete);
  const targetRepsRef = useRef(targetReps);

  useEffect(() => {
    trackerRef.current = tracker;
  }, [tracker]);

  useEffect(() => {
    accessibilityRef.current = provideFeedback;
  }, [provideFeedback]);

  useEffect(() => {
    onCompleteRef.current = onSessionComplete;
    targetRepsRef.current = targetReps;
  }, [onSessionComplete, targetReps]);

  const quality = useMemo(
    () => assessQuality(exerciseId, pose.keypoints, tracker.side, tracker.smoothedAngle),
    [exerciseId, pose.keypoints, tracker.side, tracker.smoothedAngle]
  );

  useEffect(() => {
    setCalibrationStage('idle');
    setCountdown(0);
    setShowDebug(false);
    previousRepsRef.current = 0;
    lastRepAtRef.current = 0;
    sessionEndedRef.current = false;
  }, [exerciseId, sideOverride]);

  useEffect(() => {
    if (cameraFacing !== facing) {
      setCameraFacing(facing);
    }
  }, [facing]);

  useEffect(() => {
    if (tracker.reps > previousRepsRef.current) {
      const now = Date.now();
      const hadPrevious = previousRepsRef.current > 0;
      const elapsed = hadPrevious ? now - lastRepAtRef.current : now;
      lastRepAtRef.current = now;
      previousRepsRef.current = tracker.reps;

      const correction = isRepTooFast(elapsed)
        ? 'Slow down and control each repetition.'
        : quality.correction;

      accessibilityRef.current({
        text: `${tracker.reps} repetition${tracker.reps === 1 ? '' : 's'}. Form score ${quality.score} percent.`,
        correction,
        formScore: quality.score,
        repCount: tracker.reps,
        haptic: correction ? 'warning' : 'light'
      });

      if (
        targetRepsRef.current &&
        tracker.reps >= targetRepsRef.current &&
        !sessionEndedRef.current
      ) {
        sessionEndedRef.current = true;
        onCompleteRef.current?.({
          reps: tracker.reps,
          score: quality.score,
          correction: quality.correction
        });
      }
    }
  }, [tracker.reps]);

  useEffect(() => {
    if (calibrationStage === 'start_hold') {
      accessibilityRef.current({
        text: tracker.definition.startCalibrationLabel,
        priority: 'high',
        haptic: 'success'
      });
    } else if (calibrationStage === 'end_hold') {
      accessibilityRef.current({
        text: tracker.definition.endCalibrationLabel,
        priority: 'high',
        haptic: 'success'
      });
    }
  }, [calibrationStage, tracker.definition]);

  // Auto-calibration state machine. There are no fixed timers for "get into
  // position" — the flow is:
  //   start_hold: watch the live angle. Once the user stops moving (stable
  //               within tolerance for ~2.5s), capture the START angle.
  //   end_move:   watch for movement; once they settle (angle stable ~1.2s),
  //               switch to end_hold automatically.
  //   end_hold:   once stable again for ~2.5s, capture the END angle.
  // The user moves at their own pace; we never demand they beat a timer.
  useEffect(() => {
    if (
      calibrationStage !== 'start_hold' &&
      calibrationStage !== 'end_move' &&
      calibrationStage !== 'end_hold'
    ) {
      return;
    }

    const WATCH_WINDOW_MS = 200;
    const TOLERANCE_DEG = 4;
    const STABLE_FOR_CAPTURE_MS = calibrationStage === 'end_move' ? 1200 : 2500;
    let stableSince: number | null = null;
    let lastAngle: number | null = null;

    const watch = setInterval(() => {
      const angle = trackerRef.current.smoothedAngle;
      if (angle === null) {
        stableSince = null;
        lastAngle = null;
        setCountdown(0);
        return;
      }

      if (lastAngle === null || Math.abs(angle - lastAngle) <= TOLERANCE_DEG) {
        stableSince = stableSince ?? Date.now();
        if (Date.now() - stableSince >= STABLE_FOR_CAPTURE_MS) {
          if (calibrationStage === 'end_move') {
            // User has settled in the end pose — begin the end hold capture.
            trackerRef.current.beginEndCalibration();
            clearInterval(watch);
            setCalibrationStage('end_hold');
            return;
          }
          const didSave = trackerRef.current.captureCalibrationPhase();
          clearInterval(watch);
          setCalibrationStage(
            didSave ? (calibrationStage === 'start_hold' ? 'end_move' : 'complete') : 'failed'
          );
          return;
        }
      } else {
        // User is still moving — the end position has not been reached yet.
        stableSince = null;
      }
      lastAngle = angle;
      const remaining = Math.max(
        0,
        Math.ceil((STABLE_FOR_CAPTURE_MS - (stableSince ? Date.now() - stableSince : 0)) / 1000)
      );
      setCountdown(remaining);
    }, WATCH_WINDOW_MS);

    return () => clearInterval(watch);
  }, [calibrationStage]);

  function beginCalibration() {
    tracker.resetTracker();
    tracker.beginStartCalibration();
    setCalibrationStage('start_hold');
  }

  const selectedKeypointNames = tracker.selectedKeypoints.map((keypoint) => keypoint.name);
  const visibleNames = pose.visibleKeypointNames;
  const missingRequired = tracker.requiredKeypoints.filter(
    (name) => !visibleNames.includes(name)
  );
  const canCalibrate =
    pose.modelStatus === 'ready' && missingRequired.length === 0;

  const sourceWidth = pose.sourceSize?.width ?? 192;
  const sourceHeight = pose.sourceSize?.height ?? 192;

  if (!pose.permission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centerTitle}>Preparing camera</Text>
      </View>
    );
  }

  if (!pose.permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centerTitle}>Camera access</Text>
        <Text style={styles.centerText}>UniFit needs the camera to watch your movement.</Text>
        <Pressable
          accessibilityRole="button"
          style={styles.permissionButton}
          onPress={pose.requestPermission}
        >
          <Text style={styles.permissionButtonText}>Allow camera</Text>
        </Pressable>
      </View>
    );
  }

  const stage = stageDetails[calibrationStage];
  const isTracking = calibrationStage === 'complete';
  const feedback = tracker.feedback;

  return (
    <View style={styles.screen}>
      <View style={styles.cameraArea}>
        <View style={cameraSize}>
          <TensorCamera
            style={StyleSheet.absoluteFill}
            facing={pose.facing}
            ratio={Platform.OS === 'android' ? '4:3' : undefined}
            autorender={true}
            useCustomShadersToResize={false}
            cameraTextureWidth={0}
            cameraTextureHeight={0}
            resizeWidth={192}
            resizeHeight={192}
            resizeDepth={3}
            onReady={pose.handleCameraStream}
            onError={pose.handleCameraError}
          />

          <View pointerEvents="none" style={styles.overlay}>
            <SkeletonOverlay
              keypoints={pose.keypoints}
              mirrorX={pose.mirrorX}
              size={cameraSize}
              activeSide={tracker.side}
              isGoodForm={quality.score >= 80}
            />
            {pose.keypoints.map((keypoint) => {
              const hasEnoughConfidence =
                typeof keypoint.score !== 'number' || keypoint.score >= 0.35;

              if (!hasEnoughConfidence) {
                return null;
              }

              const isTracked = selectedKeypointNames.includes(keypoint.name);
              const xFraction = pose.mirrorX
                ? 1 - keypoint.x / sourceWidth
                : keypoint.x / sourceWidth;
              const yFraction = keypoint.y / sourceHeight;

              return (
                <View
                  key={keypoint.name}
                  style={[
                    styles.keypoint,
                    isTracked ? styles.trackedKeypoint : styles.otherKeypoint,
                    {
                      left: `${xFraction * 100}%`,
                      top: `${yFraction * 100}%`
                    }
                  ]}
                />
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.topArea} pointerEvents="box-none">
        <View style={styles.chipRow}>
          {showExerciseSwitcher
            ? exerciseOptions.map((option) => {
                const isSelected = option === exerciseId;

                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => onExerciseChange?.(option)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {exerciseLabels[option]}
                    </Text>
                  </Pressable>
                );
              })
            : null}

          <Pressable
            accessibilityRole="button"
            style={styles.chip}
            onPress={() =>
              setCameraFacing((current) => (current === 'front' ? 'back' : 'front'))
            }
          >
            <Text style={styles.chipText}>
              {cameraFacing === 'front' ? 'Back camera' : 'Front camera'}
            </Text>
          </Pressable>

          {onExit ? (
            <Pressable
              accessibilityRole="button"
              style={[styles.chip, styles.exitChip]}
              onPress={onExit}
            >
              <Text style={styles.chipText}>Exit</Text>
            </Pressable>
          ) : null}
        </View>

        {pose.modelStatus === 'loading' ? (
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>Loading pose tracker…</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.bottomCard}>
        {pose.error ? (
          <Text accessibilityRole="alert" style={styles.errorText}>
            {pose.error}
          </Text>
        ) : (
          <>
            <View style={styles.stageRow}>
              <View style={styles.stageCopy}>
                <Text style={styles.stageLabel}>{stage.label}</Text>
                <Text style={styles.stageHint}>{stage.hint(tracker)}</Text>
              </View>
              {countdown > 0 ? <Text style={styles.countdown}>{countdown}</Text> : null}
            </View>

            <View style={styles.statsRow}>
              <Text style={styles.stat}>
                Reps {tracker.reps}
              </Text>
              <Text style={styles.stat}>
                Angle {tracker.smoothedAngle === null ? '--' : `${Math.round(tracker.smoothedAngle)}°`}
              </Text>
              <Text style={[styles.stat, feedback === 'good' && styles.statGood]}>
                {feedbackLabels[feedback] ?? feedback}
              </Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.stat}>Form {quality.score}%</Text>
              <Text style={styles.stat}>
                {targetReps ? `Target ${Math.min(tracker.reps, targetReps)}/${targetReps}` : 'Unlimited'}
              </Text>
              {quality.correction ? (
                <Text style={styles.correctionText}>{quality.correction}</Text>
              ) : null}
            </View>

            <View style={styles.actionRow}>
              <Pressable
                accessibilityRole="button"
                disabled={!canCalibrate}
                style={({ pressed }) => [
                  styles.calibrateButton,
                  !canCalibrate && styles.calibrateButtonDisabled,
                  pressed && styles.pressed
                ]}
                onPress={beginCalibration}
              >
                <Text style={styles.calibrateButtonText}>
                  {!canCalibrate
                    ? 'Show your joints to the camera'
                    : isTracking
                      ? 'Recalibrate'
                      : 'Calibrate'}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                style={styles.debugButton}
                onPress={() => setShowDebug((current) => !current)}
              >
                <Text style={styles.debugButtonText}>{showDebug ? 'Hide details' : 'Details'}</Text>
              </Pressable>
            </View>
          </>
        )}

        {showDebug && !pose.error ? (
          <View style={styles.debugPanel}>
            <Text style={styles.debugText}>
              Detected: {visibleNames.length ? visibleNames.map(jointLabel).join(', ') : 'none'}
            </Text>
            <Text style={styles.debugText}>
              Used: {selectedKeypointNames.length ? selectedKeypointNames.map(jointLabel).join(', ') : 'none'}
            </Text>
            <Text style={styles.debugText}>
              Missing: {missingRequired.length ? missingRequired.map(jointLabel).join(', ') : 'none'}
            </Text>
            <Text style={styles.debugText}>
              Model: {pose.modelStatus} · {pose.framesProcessed} frames
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b1220',
    overflow: 'hidden'
  },
  cameraArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 24,
    backgroundColor: '#0b1220'
  },
  centerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff'
  },
  centerText: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 21,
    color: '#d1d5db'
  },
  permissionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#ffffff'
  },
  permissionButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0b1220'
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20
  },
  keypoint: {
    position: 'absolute',
    borderRadius: 999
  },
  trackedKeypoint: {
    width: 18,
    height: 18,
    marginLeft: -9,
    marginTop: -9,
    borderWidth: 3,
    borderColor: '#ffffff',
    backgroundColor: '#22d3ee'
  },
  otherKeypoint: {
    width: 10,
    height: 10,
    marginLeft: -5,
    marginTop: -5,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: '#f59e0b'
  },
  topArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingTop: 54,
    paddingHorizontal: 12,
    gap: 8
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(11, 18, 32, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  chipSelected: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff'
  },
  exitChip: {
    marginLeft: 'auto'
  },
  chipText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff'
  },
  chipTextSelected: {
    color: '#0b1220'
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(11, 18, 32, 0.72)'
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff'
  },
  bottomCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    zIndex: 30,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.93)'
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  stageCopy: {
    flex: 1,
    gap: 3
  },
  stageLabel: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0b1220'
  },
  stageHint: {
    fontSize: 14,
    lineHeight: 19,
    color: '#374151'
  },
  countdown: {
    minWidth: 44,
    textAlign: 'center',
    fontSize: 32,
    fontWeight: '900',
    color: '#0284c7'
  },
  statsRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10
  },
  stat: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: '#4b5563'
  },
  statGood: {
    color: '#15803d'
  },
  correctionText: {
    flex: 2,
    fontSize: 12,
    fontWeight: '800',
    color: '#b45309'
  },
  actionRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8
  },
  calibrateButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0ea5e9'
  },
  calibrateButtonDisabled: {
    backgroundColor: '#9ca3af'
  },
  calibrateButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff'
  },
  debugButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#e5e7eb'
  },
  debugButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0b1220'
  },
  pressed: {
    opacity: 0.72
  },
  errorText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b91c1c'
  },
  debugPanel: {
    marginTop: 10,
    gap: 2
  },
  debugText: {
    fontSize: 11,
    lineHeight: 15,
    color: '#4b5563'
  }
});

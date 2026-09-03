import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { CameraType } from 'expo-camera';
import { TensorCamera } from './cv/TensorCamera';
import { usePoseDetection } from './cv/usePoseDetection';
import { useExerciseTracker } from './cv/useExerciseTracker';
import { ExerciseId, Side } from './cv/types';
import { assessQuality } from './cv/quality';
import { isRepTooFast } from './cv/tempo';
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
    label: 'Hold start position',
    hint: (tracker) => tracker.definition.startCalibrationLabel
  },
  end_move: {
    label: 'Move to the end position',
    hint: (tracker) => tracker.definition.endCalibrationLabel
  },
  end_hold: {
    label: 'Hold still',
    hint: () => 'Keep the end position steady for the countdown.'
  },
  complete: {
    label: 'Calibrated',
    hint: () => 'Now do full reps. Watch the dots follow your body.'
  },
  failed: {
    label: 'Not steady',
    hint: () => 'The pose moved too much. Tap Recalibrate and hold still.'
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

  useEffect(() => {
    accessibilityRef.current = provideFeedback;
  }, [provideFeedback]);

  const quality = useMemo(
    () => assessQuality(exerciseId, pose.keypoints, tracker.side, tracker.smoothedAngle),
    [exerciseId, pose.keypoints, tracker.side, tracker.smoothedAngle]
  );

  useEffect(() => {
    trackerRef.current = tracker;
  }, [tracker]);

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
      const elapsed = previousRepsRef.current === 0 ? now : now - lastRepAtRef.current;
      lastRepAtRef.current = now;

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

      if (targetReps && tracker.reps >= targetReps && !sessionEndedRef.current) {
        sessionEndedRef.current = true;
        onSessionComplete?.({
          reps: tracker.reps,
          score: quality.score,
          correction: quality.correction
        });
      }

      previousRepsRef.current = tracker.reps;
    }
  }, [tracker.reps, targetReps, quality.correction, quality.score, onSessionComplete]);

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

  useEffect(() => {
    const isActiveStage =
      calibrationStage === 'start_hold' ||
      calibrationStage === 'end_move' ||
      calibrationStage === 'end_hold';

    if (!isActiveStage) {
      return;
    }

    const seconds = calibrationStage === 'end_move' ? 4 : 3;
    const finishesAt = Date.now() + seconds * 1000;
    setCountdown(seconds);

    const tick = setInterval(() => {
      setCountdown(Math.max(0, Math.ceil((finishesAt - Date.now()) / 1000)));
    }, 200);

    const finish = setTimeout(() => {
      clearInterval(tick);

      if (calibrationStage === 'start_hold') {
        const didSave = trackerRef.current.captureCalibrationPhase();
        setCalibrationStage(didSave ? 'end_move' : 'failed');
        return;
      }

      if (calibrationStage === 'end_move') {
        trackerRef.current.beginEndCalibration();
        setCalibrationStage('end_hold');
        return;
      }

      const didSave = trackerRef.current.captureCalibrationPhase();
      setCalibrationStage(didSave ? 'complete' : 'failed');
    }, seconds * 1000);

    return () => {
      clearInterval(tick);
      clearTimeout(finish);
    };
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

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { captureCalibrationAngle, normalizeCalibration } from './calibration';
import { chooseVisibleSide, exerciseDefinitions } from './exercises';
import { getFeedbackState } from './feedback';
import { getVisibleKeypoints } from './keypoints';
import { smoothAngle } from './math';
import { createRepCounterState, updateRepCounter } from './repCounter';
import { AngleCalibration, CalibrationPhase, CvKeypoint, ExerciseId, FeedbackState, Side } from './types';

export function useExerciseTracker(
  exerciseId: ExerciseId,
  keypoints: CvKeypoint[],
  sideOverride?: Side
) {
  const definition = exerciseDefinitions[exerciseId];

  // activeSide is state so it stays stable across frames: every keypoint
  // update must not reset the tracker or flip sides mid-movement.
  const [activeSide, setActiveSide] = useState<Side>(
    sideOverride ?? definition.defaultSide
  );
  const sideLockedRef = useRef<Side>(sideOverride ?? definition.defaultSide);
  sideLockedRef.current = sideOverride ?? sideLockedRef.current;

  // When no explicit override is given, auto-pick the visible side, but only
  // when it is clearly better (hysteresis lives in chooseVisibleSide). This
  // runs as a side-effect on keypoint updates, never during render.
  useEffect(() => {
    if (sideOverride) {
      return;
    }
    const detected = chooseVisibleSide(exerciseId, keypoints, sideLockedRef.current);
    if (detected !== sideLockedRef.current) {
      sideLockedRef.current = detected;
      setActiveSide(detected);
    }
  }, [exerciseId, keypoints, sideOverride]);

  const requiredKeypoints = useMemo(
    () => definition.getRequiredKeypoints(activeSide),
    [activeSide, definition]
  );
  const recentAnglesRef = useRef<Array<number | null>>([]);
  const lastSmoothedRef = useRef<number | null>(null);
  const [smoothedAngle, setSmoothedAngle] = useState<number | null>(null);
  const [calibrationPhase, setCalibrationPhase] = useState<CalibrationPhase>('idle');
  const [calibration, setCalibration] = useState<AngleCalibration | null>(null);
  const [repState, dispatchRep] = useReducer(repCounterReducer, undefined, createRepCounterState);
  const repStateRef = useRef(repState);
  repStateRef.current = repState;
  const calibrationSamplesRef = useRef<number[]>([]);
  const calibrationPhaseRef = useRef<CalibrationPhase>(calibrationPhase);

  useEffect(() => {
    calibrationPhaseRef.current = calibrationPhase;
  }, [calibrationPhase]);

  useEffect(() => {
    recentAnglesRef.current = [];
    setSmoothedAngle(null);
    setCalibrationPhase('idle');
    setCalibration(null);
    dispatchRep({ type: 'reset' });
    repStateRef.current = createRepCounterState();
    calibrationSamplesRef.current = [];
  }, [exerciseId, sideOverride]);

  useEffect(() => {
    const nextAngle = definition.getAngle(keypoints, activeSide);
    recentAnglesRef.current = [...recentAnglesRef.current, nextAngle].slice(-5);
    const smoothed = smoothAngle(recentAnglesRef.current);
    // Don't re-render the whole tracker tree when the smoothed angle is
    // unchanged (detection frames arrive continuously even when still).
    if (smoothed !== lastSmoothedRef.current) {
      lastSmoothedRef.current = smoothed;
      setSmoothedAngle(smoothed);
    }
  }, [activeSide, definition, keypoints]);

  useEffect(() => {
    if (calibrationPhase === 'start' || calibrationPhase === 'end') {
      if (smoothedAngle !== null) {
        calibrationSamplesRef.current = [...calibrationSamplesRef.current, smoothedAngle].slice(-25);
      }

      return;
    }

    calibrationSamplesRef.current = [];
  }, [calibrationPhase, smoothedAngle]);

  // Update the rep counter on every angle change but ONLY dispatch when the
  // counter genuinely transitions. The reducer is idempotent for identical
  // state, but the dispatch call itself is avoided unless reps/phase change.
  useEffect(() => {
    if (
      calibration === null ||
      smoothedAngle === null ||
      calibrationPhase !== 'complete'
    ) {
      return;
    }
    const current = repStateRef.current;
    const next = updateRepCounter(current, smoothedAngle, calibration);
    if (
      next !== current &&
      (next.reps !== current.reps || next.phase !== current.phase)
    ) {
      repStateRef.current = next;
      dispatchRep({ type: 'tick', angle: smoothedAngle, calibration });
    }
  }, [calibration, calibrationPhase, smoothedAngle]);

  // Calibration is canonicalized so START = the straight/standing pose
  // (larger joint angle) and END = the bent/contracted pose (smaller angle).
  // Reps register on REACHING the end. While in the 'start' phase the user is
  // heading toward the end (curl up / squat down) -> cue 'up'. After the rep
  // they return toward start -> cue 'down'.
  const target = repState.phase === 'start' ? 'up' : 'down';
  const feedbackValue = getFeedbackState(smoothedAngle, calibration, target);

  const selectedKeypoints = useMemo(
    () => getVisibleKeypoints(keypoints, requiredKeypoints),
    [keypoints, requiredKeypoints]
  );

  const beginStartCalibration = useCallback(() => {
    calibrationSamplesRef.current = [];
    setCalibrationPhase('start');
  }, []);

  const beginEndCalibration = useCallback(() => {
    calibrationSamplesRef.current = [];
    setCalibrationPhase('end');
  }, []);

  const captureCalibrationPhase = useCallback(() => {
    const capturedAngle = captureCalibrationAngle(calibrationSamplesRef.current);

    if (capturedAngle === null) {
      return false;
    }

    const phase = calibrationPhaseRef.current;

    if (phase === 'start') {
      setCalibration((currentCalibration) =>
        normalizeCalibration(capturedAngle, currentCalibration?.endAngle ?? capturedAngle)
      );
      setCalibrationPhase('idle');
      return true;
    }

    if (phase === 'end') {
      setCalibration((currentCalibration) => {
        const previousStart = currentCalibration?.startAngle;
        return normalizeCalibration(previousStart ?? capturedAngle, capturedAngle);
      });
      setCalibrationPhase('complete');
      return true;
    }

    return false;
  }, []);

  const resetTracker = useCallback(() => {
    recentAnglesRef.current = [];
    setSmoothedAngle(null);
    setCalibrationPhase('idle');
    setCalibration(null);
    dispatchRep({ type: 'reset' });
    repStateRef.current = createRepCounterState();
    calibrationSamplesRef.current = [];
  }, []);

  return {
    definition,
    side: activeSide,
    requiredKeypoints,
    selectedKeypoints,
    smoothedAngle,
    calibration,
    calibrationPhase,
    feedback: feedbackValue,
    reps: repState.reps,
    phase: repState.phase,
    beginStartCalibration,
    beginEndCalibration,
    captureCalibrationPhase,
    resetTracker
  };
}

type RepCounterAction =
  | { type: 'reset' }
  | { type: 'tick'; angle: number; calibration: AngleCalibration };

function repCounterReducer(
  state: ReturnType<typeof createRepCounterState>,
  action: RepCounterAction
) {
  if (action.type === 'reset') {
    return createRepCounterState();
  }
  return updateRepCounter(state, action.angle, action.calibration);
}

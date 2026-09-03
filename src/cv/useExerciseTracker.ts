import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { captureCalibrationAngle, createCalibration } from './calibration';
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
    calibrationSamplesRef.current = [];
  }, [exerciseId]);

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

  useEffect(() => {
    if (calibration === null || smoothedAngle === null) {
      return;
    }
    dispatchRep({ type: 'tick', angle: smoothedAngle, calibration });
  }, [calibration, smoothedAngle]);

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
        createCalibration(capturedAngle, currentCalibration?.endAngle ?? capturedAngle)
      );
      setCalibrationPhase('idle');
      return true;
    }

    if (phase === 'end') {
      setCalibration((currentCalibration) =>
        createCalibration(currentCalibration?.startAngle ?? capturedAngle, capturedAngle)
      );
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

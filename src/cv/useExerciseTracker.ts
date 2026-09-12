import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { captureCalibrationAngle, normalizeCalibration } from './calibration';
import { chooseVisibleSide, exerciseDefinitions } from './exercises';
import { getFeedbackState } from './feedback';
import { getVisibleKeypoints } from './keypoints';
import { smoothAngle } from './math';
import { createRepCounterState, updateRepCounter } from './repCounter';
import { AngleCalibration, CalibrationPhase, CvKeypoint, ExerciseId, FeedbackState, Side } from './types';
import { trackEffectBurst } from './debugRenderCount';

export function useExerciseTracker(
  exerciseId: ExerciseId,
  keypoints: CvKeypoint[],
  sideOverride?: Side,
  paused = false
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
    trackEffectBurst('tracker.sidePick');
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
  const calibrationRef = useRef<AngleCalibration | null>(null);
  calibrationRef.current = calibration;
  const [repState, dispatchRep] = useReducer(repCounterReducer, undefined, createRepCounterState);
  const repStateRef = useRef(repState);
  repStateRef.current = repState;
  const calibrationSamplesRef = useRef<number[]>([]);
  const calibrationPhaseRef = useRef<CalibrationPhase>(calibrationPhase);

  useEffect(() => {
    trackEffectBurst('tracker.phaseRef');
    calibrationPhaseRef.current = calibrationPhase;
  }, [calibrationPhase]);

  useEffect(() => {
    trackEffectBurst('tracker.reset');
    if (sideOverride) {
      // Controlled side changes (bilateral switch) own the tracker side:
      // update the authoritative value here so reset and side state move
      // together instead of leaving a stale second copy behind.
      sideLockedRef.current = sideOverride;
      setActiveSide(sideOverride);
    }
    recentAnglesRef.current = [];
    setSmoothedAngle(null);
    setCalibrationPhase('idle');
    setCalibration(null);
    dispatchRep({ type: 'reset' });
    repStateRef.current = createRepCounterState();
    calibrationSamplesRef.current = [];
  }, [exerciseId, sideOverride]);

  useEffect(() => {
    trackEffectBurst('tracker.smoothAngle');
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

  trackEffectBurst('tracker.calSamples');

  if (

    calibrationPhase !== 'start' &&

    calibrationPhase !== 'end'

  ) {

    calibrationSamplesRef.current = [];

    return;

  }

  calibrationSamplesRef.current = [];

  const collectSample = () => {

    const angle = lastSmoothedRef.current;

    if (angle === null) {

      return;

    }

    calibrationSamplesRef.current = [

      ...calibrationSamplesRef.current,

      angle

    ].slice(-25);

  };

  collectSample();

  const timer = setInterval(

    collectSample,

    100

  );

  return () => {

    clearInterval(timer);

  };

}, [calibrationPhase]);
  // Update the rep counter on every angle change but ONLY dispatch when the
  // counter genuinely transitions. The reducer is idempotent for identical
  // state, but the dispatch call itself is avoided unless reps/phase change.
  useEffect(() => {
    trackEffectBurst('tracker.repTick');
    if (
      paused ||
      calibration === null ||
      smoothedAngle === null ||
      calibrationPhase !== 'complete'
    ) {
      return;
    }
 const current = repStateRef.current;
const range = calibration.endAngle - calibration.startAngle;

const progress =

  Math.abs(range) < 1

    ? 0

    : Math.max(

        0,

        Math.min(

          1,

          (smoothedAngle - calibration.startAngle) / range

        )

      );

console.warn('[REP DEBUG]', {

  angle: smoothedAngle,

  start: calibration.startAngle,

  end: calibration.endAngle,

  progress: Number(progress.toFixed(2)),

  phase: current.phase,

  reps: current.reps,

  primed: current.primed,

  paused,

  calibrationPhase

});

 const next = updateRepCounter(current, smoothedAngle, calibration);
    if (next !== current) {
      repStateRef.current = next;
      dispatchRep({ type: 'tick', angle: smoothedAngle, calibration });
    }
  }, [calibration, calibrationPhase, paused, smoothedAngle]);

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
      const previousEnd = calibrationRef.current?.endAngle ?? capturedAngle;
      setCalibration(normalizeCalibration(capturedAngle, previousEnd));
      setCalibrationPhase('idle');
      return true;
    }

    if (phase === 'end') {
      // Displacement gate (CV-07): the end pose must be measurably different
      // from the start hold. A no-movement capture must fail instead of
      // producing a bogus "complete" calibration.
      const previousStartAngle = calibrationRef.current?.startAngle ?? null;
      if (
        previousStartAngle === null ||
        Math.abs(previousStartAngle - capturedAngle) < 8
      ) {
        setCalibrationPhase('idle');
        return false;
      }
      setCalibration(
        normalizeCalibration(previousStartAngle, capturedAngle)
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
    repStateRef.current = createRepCounterState();
    calibrationSamplesRef.current = [];
  }, []);

  /**
   * Applies a previously saved calibration (per user/exercise/side) so users
   * skip the two holds on repeat sessions. Recalibrating replaces it.
   */
  const applySavedCalibration = useCallback((saved: AngleCalibration) => {
    recentAnglesRef.current = [];
    setSmoothedAngle(null);
    setCalibration(normalizeCalibration(saved.startAngle, saved.endAngle));
    setCalibrationPhase('complete');
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
    resetTracker,
    applySavedCalibration
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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

  // activeSide must be stable across frames or every keypoint update would
  // reset the tracker (and flip the visible side back and forth while the
  // user is moving, since a limb can be occluded for a frame).
  const sideRef = useRef<Side>(sideOverride ?? definition.defaultSide);

  const activeSide = sideOverride ?? chooseVisibleSide(exerciseId, keypoints, sideRef.current);

  if (!sideOverride) {
    sideRef.current = activeSide;
  }

  const requiredKeypoints = useMemo(
    () => definition.getRequiredKeypoints(activeSide),
    [activeSide, definition]
  );
  const recentAnglesRef = useRef<Array<number | null>>([]);
  const lastSmoothedRef = useRef<number | null>(null);
  const [smoothedAngle, setSmoothedAngle] = useState<number | null>(null);
  const [calibrationPhase, setCalibrationPhase] = useState<CalibrationPhase>('idle');
  const [calibration, setCalibration] = useState<AngleCalibration | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>('needs_calibration');
  const [repState, setRepState] = useState(createRepCounterState());
  const calibrationSamplesRef = useRef<number[]>([]);
  const calibrationPhaseRef = useRef<CalibrationPhase>(calibrationPhase);
  calibrationPhaseRef.current = calibrationPhase;

  useEffect(() => {
    recentAnglesRef.current = [];
    setSmoothedAngle(null);
    setCalibrationPhase('idle');
    setCalibration(null);
    setFeedback('needs_calibration');
    setRepState(createRepCounterState());
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
    const target = repState.phase === 'start' ? 'up' : 'down';
    setFeedback(getFeedbackState(smoothedAngle, calibration, target));
    setRepState((currentState) => updateRepCounter(currentState, smoothedAngle, calibration));
  }, [calibration, repState.phase, smoothedAngle]);

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
    setFeedback('needs_calibration');
    setRepState(createRepCounterState());
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
    feedback,
    reps: repState.reps,
    beginStartCalibration,
    beginEndCalibration,
    captureCalibrationPhase,
    resetTracker
  };
}

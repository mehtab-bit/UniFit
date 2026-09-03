import { useEffect, useMemo, useRef, useState } from 'react';
import { captureCalibrationAngle, createCalibration } from './calibration';
import { exerciseDefinitions } from './exercises';
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
  const activeSide = sideOverride ?? chooseVisibleSide(definition, keypoints);
  const requiredKeypoints = definition.getRequiredKeypoints(activeSide);
  const recentAnglesRef = useRef<Array<number | null>>([]);
  const [smoothedAngle, setSmoothedAngle] = useState<number | null>(null);
  const [calibrationPhase, setCalibrationPhase] = useState<CalibrationPhase>('idle');
  const [calibration, setCalibration] = useState<AngleCalibration | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>('needs_calibration');
  const [repState, setRepState] = useState(createRepCounterState());
  const calibrationSamplesRef = useRef<number[]>([]);

  useEffect(() => {
    recentAnglesRef.current = [];
    setSmoothedAngle(null);
    setCalibrationPhase('idle');
    setCalibration(null);
    setFeedback('needs_calibration');
    setRepState(createRepCounterState());
    calibrationSamplesRef.current = [];
  }, [exerciseId, activeSide]);

  useEffect(() => {
    const nextAngle = definition.getAngle(keypoints, activeSide);
    recentAnglesRef.current = [...recentAnglesRef.current, nextAngle].slice(-5);
    setSmoothedAngle(smoothAngle(recentAnglesRef.current));
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

  function beginStartCalibration() {
    calibrationSamplesRef.current = [];
    setCalibrationPhase('start');
  }

  function beginEndCalibration() {
    calibrationSamplesRef.current = [];
    setCalibrationPhase('end');
  }

  function captureCalibrationPhase() {
    const capturedAngle = captureCalibrationAngle(calibrationSamplesRef.current);

    if (capturedAngle === null) {
      return false;
    }

    if (calibrationPhase === 'start') {
      setCalibration((currentCalibration) =>
        createCalibration(capturedAngle, currentCalibration?.endAngle ?? capturedAngle)
      );
      setCalibrationPhase('idle');
      return true;
    }

    if (calibrationPhase === 'end') {
      setCalibration((currentCalibration) =>
        createCalibration(currentCalibration?.startAngle ?? capturedAngle, capturedAngle)
      );
      setCalibrationPhase('complete');
      return true;
    }

    return false;
  }

  function resetTracker() {
    recentAnglesRef.current = [];
    setSmoothedAngle(null);
    setCalibrationPhase('idle');
    setCalibration(null);
    setFeedback('needs_calibration');
    setRepState(createRepCounterState());
    calibrationSamplesRef.current = [];
  }

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

function chooseVisibleSide(
  definition: (typeof exerciseDefinitions)[ExerciseId],
  keypoints: CvKeypoint[]
): Side {
  const leftVisible = getVisibleKeypoints(keypoints, definition.getRequiredKeypoints('left')).length;
  const rightVisible = getVisibleKeypoints(keypoints, definition.getRequiredKeypoints('right')).length;

  if (leftVisible > rightVisible) {
    return 'left';
  }

  return definition.defaultSide;
}

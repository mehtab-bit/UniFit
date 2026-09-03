import { angleAtPoint, findKeypoint } from './math';
import { CvKeypoint, ExerciseDefinition, Side } from './types';

function sideName(side: Side, joint: 'shoulder' | 'elbow' | 'wrist' | 'hip' | 'knee' | 'ankle') {
  return `${side}_${joint}` as const;
}

function getArmBendAngle(keypoints: CvKeypoint[], side: Side) {
  const shoulder = findKeypoint(keypoints, sideName(side, 'shoulder'));
  const elbow = findKeypoint(keypoints, sideName(side, 'elbow'));
  const wrist = findKeypoint(keypoints, sideName(side, 'wrist'));

  if (!shoulder || !elbow || !wrist) {
    return null;
  }

  return angleAtPoint(shoulder, elbow, wrist);
}

function getLegBendAngle(keypoints: CvKeypoint[], side: Side) {
  const hip = findKeypoint(keypoints, sideName(side, 'hip'));
  const knee = findKeypoint(keypoints, sideName(side, 'knee'));
  const ankle = findKeypoint(keypoints, sideName(side, 'ankle'));

  if (!hip || !knee || !ankle) {
    return null;
  }

  return angleAtPoint(hip, knee, ankle);
}

export const exerciseDefinitions: Record<string, ExerciseDefinition> = {
  squat: {
    id: 'squat',
    title: 'Squat',
    cameraGuidance: 'Use a side view so your hip, knee and ankle stay visible.',
    startCalibrationLabel: 'Stand tall in your starting position.',
    endCalibrationLabel: 'Hold your lowest comfortable squat position.',
    defaultSide: 'right',
    getRequiredKeypoints: (side) => [
      sideName(side, 'hip'),
      sideName(side, 'knee'),
      sideName(side, 'ankle')
    ],
    getAngle: getLegBendAngle
  },
  lunge: {
    id: 'lunge',
    title: 'Lunge',
    cameraGuidance: 'Use a side view so your hip, knee and ankle stay visible.',
    startCalibrationLabel: 'Stand tall with your front foot planted.',
    endCalibrationLabel: 'Hold your lowest comfortable lunge position.',
    defaultSide: 'right',
    getRequiredKeypoints: (side) => [
      sideName(side, 'hip'),
      sideName(side, 'knee'),
      sideName(side, 'ankle')
    ],
    getAngle: getLegBendAngle
  },
  pushup: {
    id: 'pushup',
    title: 'Push-Up',
    cameraGuidance: 'Use a side view so your shoulder, elbow and wrist stay visible.',
    startCalibrationLabel: 'Hold the straight-arm starting position.',
    endCalibrationLabel: 'Hold your lowest comfortable push-up position.',
    defaultSide: 'right',
    getRequiredKeypoints: (side) => [
      sideName(side, 'shoulder'),
      sideName(side, 'elbow'),
      sideName(side, 'wrist')
    ],
    getAngle: getArmBendAngle
  },
  bicep_curl: {
    id: 'bicep_curl',
    title: 'Bicep Curl',
    cameraGuidance: 'Use a side or slight diagonal view so your shoulder, elbow and wrist stay visible.',
    startCalibrationLabel: 'Hold your arm relaxed and straight.',
    endCalibrationLabel: 'Hold your curl at the highest comfortable point.',
    defaultSide: 'right',
    getRequiredKeypoints: (side) => [
      sideName(side, 'shoulder'),
      sideName(side, 'elbow'),
      sideName(side, 'wrist')
    ],
    getAngle: getArmBendAngle
  },
  supported_row: {
    id: 'supported_row',
    title: 'Supported Row',
    cameraGuidance: 'Use a side view so your shoulder, elbow and wrist stay visible.',
    startCalibrationLabel: 'Hold the lowered starting position.',
    endCalibrationLabel: 'Hold the row at your most comfortable pulled position.',
    defaultSide: 'right',
    getRequiredKeypoints: (side) => [
      sideName(side, 'shoulder'),
      sideName(side, 'elbow'),
      sideName(side, 'wrist')
    ],
    getAngle: getArmBendAngle
  }
};

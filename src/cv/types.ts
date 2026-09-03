export type ExerciseId = 'squat' | 'lunge' | 'pushup' | 'bicep_curl' | 'supported_row';

export type FeedbackState =
  | 'not_visible'
  | 'needs_calibration'
  | 'get_ready'
  | 'move_up'
  | 'move_down'
  | 'good'
  | 'too_fast';

export type CalibrationPhase = 'idle' | 'start' | 'end' | 'complete';

export type KeypointName =
  | 'nose'
  | 'left_eye'
  | 'right_eye'
  | 'left_ear'
  | 'right_ear'
  | 'left_shoulder'
  | 'right_shoulder'
  | 'left_elbow'
  | 'right_elbow'
  | 'left_wrist'
  | 'right_wrist'
  | 'left_hip'
  | 'right_hip'
  | 'left_knee'
  | 'right_knee'
  | 'left_ankle'
  | 'right_ankle';

export type Side = 'left' | 'right';

export type CvKeypoint = {
  name: KeypointName;
  x: number;
  y: number;
  score?: number;
};

export type AngleCalibration = {
  startAngle: number;
  endAngle: number;
};

export type ExerciseDefinition = {
  id: ExerciseId;
  title: string;
  cameraGuidance: string;
  startCalibrationLabel: string;
  endCalibrationLabel: string;
  defaultSide: Side;
  getRequiredKeypoints: (side: Side) => KeypointName[];
  getAngle: (keypoints: CvKeypoint[], side: Side) => number | null;
};

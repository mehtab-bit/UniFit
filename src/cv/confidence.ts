import { Platform } from 'react-native';

/**
 * Browser webcams are often lower-resolution and lower-confidence than
 * phone cameras. Keep the stricter native threshold while allowing MoveNet
 * web detections to survive normal laptop-camera confidence levels.
 */

export const KEYPOINT_MIN_SCORE = Platform.OS === 'web'

  ? 0.25

  : 0.45;

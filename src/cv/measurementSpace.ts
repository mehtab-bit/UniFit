import { CvKeypoint } from './types';

export type MeasurementSource = { width: number; height: number } | null | undefined;

/**
 * CV-05: convert display landmarks into an isotropic measurement space.
 *
 * MoveNet/display landmarks are normalized (0..1 in each axis), which is only
 * Euclidean for square images. Native MediaPipe frames are not square, so the
 * tracker/geometry math must operate in pixel-like units (x*width, y*height).
 * The overlay keeps using the normalized points.
 */
export function toMeasurementKeypoints(
  keypoints: CvKeypoint[],
  source: MeasurementSource
): CvKeypoint[] {
  if (
    !source ||
    !Number.isFinite(source.width) ||
    !Number.isFinite(source.height) ||
    source.width <= 0 ||
    source.height <= 0
  ) {
    return keypoints;
  }
  return keypoints.map((point) => ({
    ...point,
    x: point.x * source.width,
    y: point.y * source.height
  }));
}

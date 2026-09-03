import { isStableAngle } from './math';
import { AngleCalibration } from './types';

export function captureCalibrationAngle(values: number[]) {
  if (!isStableAngle(values)) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round((total / values.length) * 10) / 10;
}

export function createCalibration(startAngle: number, endAngle: number): AngleCalibration {
  return {
    startAngle,
    endAngle
  };
}

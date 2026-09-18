import { AngleCalibration } from './types';

export function captureCalibrationAngle(values: number[]) {

  const recentValues = values

    .filter((value) => Number.isFinite(value))

    .slice(-12);

  if (recentValues.length < 5) {

    return null;

  }

  const sorted = [...recentValues].sort(

    (a, b) => a - b

  );

  const trimmed =

    sorted.length >= 8

      ? sorted.slice(1, -1)

      : sorted;

  const total = trimmed.reduce(

    (sum, value) => sum + value,

    0

  );

  return Math.round(

    (total / trimmed.length) * 10

  ) / 10;

}

export function createCalibration(

  startAngle: number,

  endAngle: number

): AngleCalibration {

  return {

    startAngle,

    endAngle

  };

}

export function normalizeCalibration(

  a: number,

  b: number

): AngleCalibration {

  if (a >= b) {

    return createCalibration(a, b);

  }

  return createCalibration(b, a);

}

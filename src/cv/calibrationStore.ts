import { SafeStorage } from '../../lib/supabase';
import { AngleCalibration } from './types';

const CALIBRATION_PREFIX = '@unifit_calibration_v2';
export function calibrationStorageKey(exerciseId: string, side: string, mode: string) {
  // Each pose pipeline normalizes landmarks differently (192x192 MoveNet vs
  // native camera dimensions), so a calibration captured under one mode is
  // not valid in the other. Scope the key by mode.
  return `${CALIBRATION_PREFIX}_${mode}_${exerciseId}_${side}`;
}

export type SavedCalibration = {
  startAngle: number;
  endAngle: number;
  savedAt: string;
};

export async function loadSavedCalibration(
  exerciseId: string,
  side: string,
  mode: string
): Promise<AngleCalibration | null> {
  try {
    const raw = await SafeStorage.getItem(
      calibrationStorageKey(exerciseId, side, mode)
    );
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedCalibration;
    const { startAngle, endAngle } = saved;
    if (
      typeof startAngle !== 'number' ||
      typeof endAngle !== 'number' ||
      !Number.isFinite(startAngle) ||
      !Number.isFinite(endAngle) ||
      startAngle < 0 ||
      startAngle > 180 ||
      endAngle < 0 ||
      endAngle > 180 ||
      Math.abs(startAngle - endAngle) < 8
    ) {
      return null;
    }
    return { startAngle, endAngle };
  } catch {
    return null;
  }
}

export async function saveCalibration(
  exerciseId: string,
  side: string,
  mode: string,
  calibration: AngleCalibration
): Promise<void> {
  const payload: SavedCalibration = {
    startAngle: calibration.startAngle,
    endAngle: calibration.endAngle,
    savedAt: new Date().toISOString()
  };
  await SafeStorage.setItem(
    calibrationStorageKey(exerciseId, side, mode),
    JSON.stringify(payload)
  );
}

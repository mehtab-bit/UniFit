import { StrengthFamily } from '../../types/domain';

export type RepMode = 'total_reps' | 'reps_each_side' | 'reps_each_arm';

/**
 * Families whose engine prescriptions count sets/reps separately per limb.
 * Used as a fallback when a plan payload omits rep_mode.
 */
export const BILATERAL_FAMILIES: StrengthFamily[] = [
  'lunge',
  'bicep_curl',
  'supported_row'
];

export type SessionPlan = {
  bilateral: boolean;
  repsPerSet: number;
  setsPerSide: number;
  /** Reps expected for one tracked side (bilateral) or the whole exercise. */
  repsPerSide: number;
  /** Full prescription including both sides when bilateral. */
  totalReps: number;
};

export function isBilateralExercise(
  family?: string,
  repMode?: string | null
): boolean {
  if (repMode === 'reps_each_side' || repMode === 'reps_each_arm') {
    return true;
  }
  return Boolean(family && BILATERAL_FAMILIES.includes(family as StrengthFamily));
}

/**
 * Builds the authoritative rep/set plan from an exercise prescription.
 *
 * The engine stores `reps` per set. For bilateral families the prescription is
 * `sets x reps` on EACH side/arm (duration math multiplies by 2 in
 * daily_targets.py), so a 2x8 curl is 16 reps per arm, 32 total.
 */
export function buildSessionPlan(options: {
  family?: string;
  sets?: number | string | null;
  reps?: number | string | null;
  repMode?: RepMode | string | null;
}): SessionPlan {
  const sets = Math.max(1, Math.round(Number(options.sets ?? 2) || 2));
  const reps = Math.max(1, Math.round(Number(options.reps ?? 8) || 8));
  const bilateral = isBilateralExercise(options.family, options.repMode);
  const repsPerSide = sets * reps;

  return {
    bilateral,
    repsPerSet: reps,
    setsPerSide: sets,
    repsPerSide,
    totalReps: bilateral ? repsPerSide * 2 : repsPerSide
  };
}

// Tunable tempo threshold. Real devices will need adjustment after testing
// phone placement, camera frame rate, and the athlete's natural speed.
export const MIN_FULL_REP_MS = 900;

export function isRepTooFast(elapsedMs: number, minimumMs = MIN_FULL_REP_MS) {
  return elapsedMs > 0 && elapsedMs < minimumMs;
}

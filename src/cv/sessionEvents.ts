export type CvSessionResult = {
  exerciseId: string;
  family: string;
  reps: number;
  score: number;
};

export type ManualSessionRequest = {
  exerciseId: string;
  family: string;
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
  repMode?: 'total_reps' | 'reps_each_side' | 'reps_each_arm';
};

type CvSessionListener = (result: CvSessionResult) => void;
type ManualSessionListener = (request: ManualSessionRequest) => void;

const listeners = new Set<CvSessionListener>();
const manualListeners = new Set<ManualSessionListener>();

export function subscribeToCvSession(listener: CvSessionListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitCvSessionResult(result: CvSessionResult) {
  listeners.forEach((listener) => listener(result));
}

export function subscribeToManualSession(listener: ManualSessionListener) {
  manualListeners.add(listener);
  return () => {
    manualListeners.delete(listener);
  };
}

/**
 * Requests a manual-counting session (camera unavailable, user preference, or
 * an exercise the camera can't track). The workout screen owns that flow.
 */
export function requestManualSession(request: ManualSessionRequest) {
  manualListeners.forEach((listener) => listener(request));
}

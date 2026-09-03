export type CvSessionResult = {
  exerciseId: string;
  family: string;
  reps: number;
  score: number;
};

type CvSessionListener = (result: CvSessionResult) => void;

const listeners = new Set<CvSessionListener>();

export function subscribeToCvSession(listener: CvSessionListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitCvSessionResult(result: CvSessionResult) {
  listeners.forEach((listener) => listener(result));
}

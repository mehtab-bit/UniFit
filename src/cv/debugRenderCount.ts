const buckets = new Map<string, { lastMs: number; count: number }>();

/**
 * Dev-only render-burst detector. React's "Maximum update depth exceeded"
 * fires when one component re-renders ~50 times within a single flush, so
 * this counts renders that happen in the same millisecond and logs the
 * component name before React gives up.
 */
export function trackRenderBurst(component: string) {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  const now = Date.now();
  const bucket = buckets.get(component) ?? { lastMs: now, count: 0 };
  if (now - bucket.lastMs > 100) {
    bucket.count = 0;
  }
  bucket.lastMs = now;
  bucket.count += 1;
  buckets.set(component, bucket);
  if (bucket.count === 30) {
    console.warn(`[UniFit-depth] ${component} rendered 30x in one flush`);
  }
}

const effectRuns = new Map<string, { lastMs: number; count: number }>();

/**
 * Dev-only detector for an effect that re-runs and re-schedules state in a
 * tight loop (the usual "Maximum update depth exceeded" cause). Logs the
 * effect's tag before React gives up.
 */
export function trackEffectBurst(tag: string) {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  const now = Date.now();
  const bucket = effectRuns.get(tag) ?? { lastMs: now, count: 0 };
  if (now - bucket.lastMs > 100) {
    bucket.count = 0;
  }
  bucket.lastMs = now;
  bucket.count += 1;
  effectRuns.set(tag, bucket);
  if (bucket.count === 20) {
    console.warn(`[UniFit-depth] effect ${tag} ran 20x in one flush`);
  }
}

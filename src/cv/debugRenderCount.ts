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
  if (bucket.count === 40) {
    console.warn(`[UniFit-depth] ${component} rendered 40x in one flush`);
  }
}

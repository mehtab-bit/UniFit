# Performance Notes — What Was Measured & What To Tune

> Rule followed here: optimize only what was measured. This file records the
> measurements we have, the fixes they justified, and the on-device profiling
> still needed.

## Measurements taken (Sept 2026, local dev machine)

| Measurement | Result | Action taken |
|---|---|---|
| Cold combined-plan generation (`/api/v1/fitness/weekly-plan`, no cache) | ~20 s wall-clock | Raised frontend API timeout 12 s → 45 s (`services/api/apiClient.ts`) |
| Warm (cached) plan generation | ~2 s | Backend caches plans in `user_weekly_plans`; kept |
| `force_regenerate=true` after cache warm | ~20 s (full regen) | `force_regenerate` + `invalidate_weekly_plan()` so profile edits don't serve stale plans |
| Two different profiles | 3 active days/1,281 kcal vs 5 days/3,349 kcal | Profile → engine wiring works end-to-end |
| Web export initial JS (single entry) | 5.24 MB raw / 1.08 MB gzip | Lazy-load the CV route: TensorFlow moved into an on-demand `CvDemoScreen` chunk |

**Web bundle after the fix (re-measured with the same export command):**

| Bundle | Size |
|---|---|
| Initial entry JS | 2.54 MB raw / 0.66 MB gzip (-51% raw, -39% gzip) |
| `CvDemoScreen` lazy chunk (loaded only when a camera session opens) | 2.70 MB raw / 0.42 MB gzip |

TFJS-family modules are ~71% of bundled source and never run on web/desktop;
route-level lazy loading keeps them out of first paint.

**Where they came from:** every plan request timed out at 12 s during cold
generation, so the app silently fell back to mocks. Raising the timeout to
exceed the engine's worst case (~45 s) fixed that. Caching the combined week
means subsequent loads are ~2 s.

## Frontend / CV performance fixes (measured by symptom)

| Symptom | Root cause found | Fix |
|---|---|---|
| "Maximum update depth exceeded" during curls | Effect-driven rep counting dispatched on every angle frame | Rep counting updates refs and only dispatches on real rep/phase transitions |
| Camera preview laggy | Detection ran on every frame and set multiple React states | Detection throttled (180 ms MoveNet / ~33 ms native); state updates only on real keypoint changes |
| Skeleton/dot flicker | Weak keypoints and per-frame form-boundary color flips | `KEYPOINT_MIN_SCORE = 0.45`, keypoint smoothing, color hysteresis |
| Phantom rep after calibration | Fresh counter started at the end pose | `repCounter` primes from the first live angle before counting |

These are qualitative (symptom-based); device numbers still need capturing.

## Real-device profiling still needed

1. **Time per detection frame** — MoveNet `estimatePoses` deltas on a
   mid-range Android phone (Expo Go). Target: comfortably under 180 ms.
2. **Native MediaPipe throughput** — run `cv-native-test` in a dev build and
   record pose/frame FPS; compare Auto vs MediaPipe vs MoveNet selections.
3. **Smoothness** — count dropped preview frames (the autorender loop already
   tolerates them); compare 4:3 vs default ratio.
4. **Bundle startup** — cold-load the CV session and record model load time
   (`modelStatus` transitions).
5. **Rep counting accuracy** — reps counted vs. actual over 3 sets per family;
   tune thresholds/cooldown only if the count is off.

## Things deliberately NOT optimized yet (do not guess)

- Native vs Expo Go frame ceilings — partially unmeasured; do not claim.
- MoveNet model size/quantization — bundled model works offline; no on-device
  timing baseline yet.
- Backend worker/uvicorn tuning — single-user local dev; no concurrency
  measurements.

## How to guard regressions

- Keep typecheck + Vitest green (`npm test`, `npx tsc --noEmit`) and backend
  tests green (`pytest backend/tests/test_engine_api.py`).
- Watch the web entry budget: keep initial entry JS under ~0.8 MB gzip; if it
  creeps up, re-run `npx expo export -p web` and profile the bundle before
  adding anything heavy to the route graph.
- After touching CV, run a curl flow on-device under both engines and watch
  for render-burst warnings.
- When touching backend plan endpoints, verify a cold (~20 s) and warm (~2 s)
  request; never shrink the frontend timeout below the cold worst case.
- If an optimization doesn't move the measurement, **revert it** and note it
  here so it isn't tried twice.

# Performance Notes — What Was Measured & What To Tune

> Rule followed here: optimize only what was measured. This file records the measurements we have, the fixes they justified, and the on-device profiling still needed.

## Measurements taken (Sept 2026, local dev machine)

| Measurement | Result | Action taken |
|---|---|---|
| Cold combined-plan generation (`/api/v1/fitness/weekly-plan`, no cache) | ~20 s wall-clock | Raised frontend API timeout 12 s → 45 s (`services/api/apiClient.ts`) |
| Warm (cached) plan generation | ~2 s | Backend caches plans in `user_weekly_plans`; kept |
| `force_regenerate=true` after cache warm | ~20 s (full regen) | Added `force_regenerate` flag + `invalidate_weekly_plan()` so profile edits don't serve stale plans |
| Two different profiles | 3 active days/1,281 kcal vs 5 days/3,349 kcal | Profile → engine wiring works end-to-end |

**Where they came from:** every plan request was timing out at 12 s during cold generation, so the app silently fell back to mocks. Raising the timeout to exceed the engine's worst case (~45 s) fixed that. Caching the combined week means subsequent loads are ~2 s.

## Frontend / CV performance fixes (measured by symptom)

The CV screen had three user-visible symptoms that drove these changes:

| Symptom | Root cause found | Fix |
|---|---|---|
| "Maximum update depth exceeded" during curls | Effect-driven rep counting dispatched on every angle frame; no-op dispatches re-rendered the whole tree | Rep counting now updates refs and only dispatches on real rep/phase transitions; quality/feedback derived during render |
| Camera preview laggy | Detection ran on every frame and set multiple React states per detection | Detection throttled to 180 ms; state updates only when keypoints actually change; debug frame counter removed from the hot path |
| Skeleton/dot flicker | Weak keypoints (score < 0.45) popped in/out; color flipped at form boundaries per frame | Central `KEYPOINT_MIN_SCORE = 0.45`; exponential keypoint smoothing; color hysteresis in `CvDemoScreen` |

These are qualitative (symptom-based) — the numbers still need to be captured on a real device.

## Real-device profiling still needed

CV inference and camera preview share the phone's JS thread. Until we measure on-device, avoid "optimizing" blind:

1. **Time per detection frame** — log `Date.now()` deltas around `estimatePoses` on a mid-range Android phone (Expo Go). Target: comfortably under the 180 ms interval.
2. **Smoothness** — count dropped preview frames (the autorender loop already tolerates them). Compare 4:3 vs default ratio.
3. **Bundle startup** — cold-load the CV session and record model load time (`usePoseDetection` `modelStatus` transitions).
4. **Rep counting accuracy** — record reps counted vs. actual reps over 3 sets per family; tune the 0.95/0.05 thresholds and 600 ms cooldown only if the count is off.

## Things deliberately NOT optimized yet (do not guess)

- Native dev builds vs. Expo Go (the GL preview ceiling differs) — not measured, so not a claim.
- MoveNet model size/quantization — bundled model works offline; no on-device timing baseline yet.
- Backend worker/uvicorn tuning — single-user local dev; no concurrency measurements.

## How to guard regressions

- Keep the typecheck + Vitest suite green (`npm test`, `npx tsc --noEmit`).
- When touching the CV screen, run the curl flow on-device and watch for the render-burst console warnings and the depth error.
- When touching the backend plan endpoints, verify a cold (~20 s) and warm (~2 s) request; never shrink the frontend timeout back below the cold worst case.
- If you try an optimization and the measurement doesn't move, **revert it** and note it here so it isn't tried twice.

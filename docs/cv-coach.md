# CV Exercise Coach — How It Works

> The on-device camera coach: pose detection, calibration, rep counting, form scoring, and the skeleton overlay.

## What runs where

Everything in this document runs **on the phone** inside Expo Go. The Python engine never sees a camera frame.

```text
expo-camera CameraView
   └─► TensorCamera (GL preview + frame generator)
          └─► usePoseDetection (TensorFlow.js MoveNet Lightning, bundled model)
                 └─► useExerciseTracker (angle math, calibration, rep counter)
                        └─► CvDemoScreen UI (skeleton overlay, cues, counts)
                               └─► on completion: workoutService.logWorkoutCompletion(...)
```

## Files

| File | Role |
|---|---|
| `src/cv/TensorCamera.tsx` | Expo SDK 52 camera → WebGL frame stream (adapted from tfjs-react-native's cameraWithTensors) |
| `src/cv/usePoseDetection.tsx` | Loads MoveNet, runs inference at a fixed interval, smooths keypoints, exposes model status |
| `src/cv/modelAssets.ts` | Loads the bundled model JSON/weights (offline) |
| `src/cv/keypoints.ts` | MoveNet output → normalized 0..1 keypoints; visibility filter |
| `src/cv/exercises.ts` | Five exercise definitions (joints used, angle function, labels) |
| `src/cv/math.ts` | Angle math + smoothing helpers |
| `src/cv/calibration.ts` | Captures start/end angles; canonicalizes them |
| `src/cv/repCounter.ts` | State machine that turns angle travel into reps |
| `src/cv/feedback.ts` | Movement-depth helpers for cues |
| `src/cv/quality.ts` | Calibration-based form score |
| `src/cv/sessionPlan.ts` | Engine-accurate sets/reps/sides targets |
| `src/cv/calibrationStore.ts` | Persists and reuses per-side calibration |
| `src/cv/SkeletonOverlay.tsx` | Draws bones over the body; green/amber color by form |
| `components/workout/ManualSessionCard.tsx` | Manual-counting session UI (camera-free) |
| `src/CvDemoScreen.tsx` | Orchestrates camera, tracking, calibration UI, countdown, announcements |
| `app/(app)/cv-session.tsx` | Route that launches a session for a prescribed exercise (family, reps, side) |

## The five families

The engine prescribes and the CV coach tracks the same five `StrengthFamily` values:

`squat`, `lunge`, `pushup`, `bicep_curl`, `supported_row`

Each has an `ExerciseDefinition` that says which joints to watch and how to compute the angle:

- **Squat / Lunge** — hip-knee-ankle leg angle.
- **Push-up / Bicep Curl / Supported Row** — shoulder-elbow-wrist arm angle.

## Calibration (auto-capture)

The coach needs your personal start/end angles before it can count reps. The flow in `CvDemoScreen`:

1. **Tap Calibrate.** Hold the **start position** (e.g. standing for a squat, arm straight for a curl).
2. The system watches the smoothed angle. When you stay still ~2.5 s it captures the **start angle** automatically.
3. Move to the **end position** (bottom of the squat, top of the curl) at your own pace.
4. When you pause there, it captures the **end angle** and switches to live rep counting.

There are no fixed "beat the timer" countdowns — you move when ready and hold still to confirm.

Calibration is **canonicalized**: all five movements go from *straight/extended (larger angle)* to *bent/contracted (smaller angle)*, so the two captured holds are ordered automatically regardless of which pose you held first.

Calibration is also **persisted per exercise and side** (`src/cv/calibrationStore.ts`). Repeat sessions reuse the saved angles automatically; Recalibrate captures and replaces them.

Sessions follow the engine prescription: sets are separated by a rest timer
(`repsPerSet`/`restSeconds`), and bilateral families (lunges, curls, rows) run
the full `sets x reps` on each side before switching. When the camera can't be
used, an honest manual-counting mode
(`components/workout/ManualSessionCard.tsx`) records reps with audio/haptic
confirmation and never fabricates a score.

## Rep counting

`repCounter.ts` tracks a small state machine over `progress`, where:

```text
progress = how far the current angle is from the calibrated start toward the calibrated end
         = 0 at start pose, 1 at end pose
```

- A rep registers when the joint **reaches the calibrated end** (progress ≥ 0.95) — the top of a curl, the bottom of a squat.
- Returning to the start pose resets for the next rep.
- A 600 ms cooldown prevents double-counting from jitter around the end threshold.

The tracker only re-renders React when a rep/phase genuinely changes — per-frame angles update refs, not component state — which eliminates the render-burst warnings seen earlier.

## Range score and skeleton color

The skeleton is the visual form indicator:

- **Green** — the tracked limb is inside the calibrated movement range and the rep counter agrees you're mid-movement with good depth.
- **Amber** — between reps, at the edges of the range, or when a form issue is flagged.

The score (`quality.ts`) is **calibration-based**, not pixel-heuristic-based: it measures how much of the calibrated range the joint is actually using. The UI presents it honestly as a **range score**, not a claim of full biomechanical form analysis. This was a deliberate change from pixel-space "elbow drift" checks, which cannot work reliably from a phone's side/front view and made the skeleton amber even for correct reps.

Color has hysteresis (several good frames required before green; several weak frames before dropping back) so a single noisy frame doesn't make it flicker.

## Keypoint confidence and smoothing

- `KEYPOINT_MIN_SCORE = 0.45` (`src/cv/confidence.ts`) filters weak detections everywhere (angle math, dots, skeleton, visibility lists) so half-tracked joints don't pop in and out.
- Detection runs every 180 ms, not every frame, to keep the JS thread free for the camera preview.
- Keypoints are exponentially smoothed; React state only updates when a point moves more than a small threshold.

## Common issues and where to look

| Symptom | Cause / fix |
|---|---|
| No dots/skeleton at all | Model still loading, or joints not visible. Use the debug panel (Details button) to see which joints are missing. |
| Only one dot on the hip | Camera framing — MoveNet needs the full limb in frame. Move the phone back, side view. |
| Skeleton flickers amber/green | Hysteresis in `CvDemoScreen` (`isGoodForm`) handles this; if it persists, loosen `quality.ts` thresholds. |
| Camera feed choppy | TensorFlow shares the JS thread with the GL preview. This is the Expo Go ceiling; native builds improve it. |
| Frozen dots after leaving a session | Pose state is cleared on model load (`usePoseDetection`); if it recurs, restart the bundler with `--clear`. |

## Tunable constants (device-calibration knobs)

| Constant | File | Default | Meaning |
|---|---|---|---|
| `DETECTION_INTERVAL_MS` | `usePoseDetection.tsx` | 180 | Inference interval |
| `KEYPOINT_MIN_SCORE` | `confidence.ts` | 0.45 | Visibility cutoff |
| `MIN_FULL_REP_MS` | `tempo.ts` | 900 | Rep-speed flag |
| Rep thresholds | `repCounter.ts` | 0.95 / 0.05 | End/start depth |
| Stability tolerance/time | `CvDemoScreen.tsx` | 4° / 2.5 s | Calibration hold |

Real phones differ — tune these on-device, not in theory.

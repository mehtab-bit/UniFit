# CV Exercise Coach — How It Works

> The on-device camera coach: pose detection, calibration, rep counting,
> range scoring, and the skeleton overlay.

## What runs where

Everything in this document runs **on the phone**. The Python engine never
sees a camera frame. Two pose engines are supported and selectable from
Profile → Camera Engine:

```text
Workout screen (strength exercise selected)
   └─► cv-session
         ├─ MediaPipe (native, Android dev builds)
         │    Vision Camera frame processor → native pose → smoothed keypoints
         └─ MoveNet (TensorFlow.js, every build incl. Expo Go)
              TensorCamera GL frames → usePoseDetection → smoothed keypoints
                     └─► useExerciseTracker (angle math, calibration, rep counter)
                            └─► CvDemoScreen UI (skeleton, cues, counts)
                                   └─► on completion: workoutService.logWorkoutCompletion(...)
```

## Files

| File | Role |
|---|---|
| `src/cv/native/runtime.ts` | Pose engine availability + Auto/MediaPipe/MoveNet override (persisted) |
| `src/cv/poseSource.ts` | Pure engine-selection helpers (unit-tested) |
| `src/cv/native/NativeCameraFeed.tsx` | Vision Camera feed for the MediaPipe plugin |
| `plugins/withPoseLandmarker.js` | Expo config plugin registering the native `poseLandmarker` frame processor |
| `src/cv/nativePose.ts` | MediaPipe landmarks → app keypoint names |
| `src/cv/TensorCamera.tsx` | Expo SDK 52 camera → WebGL frame stream (MoveNet) |
| `src/cv/usePoseDetection.tsx` | Loads MoveNet or listens to native frames; smooths keypoints |
| `src/cv/keypoints.ts` | Keypoint normalization + visibility filter |
| `src/cv/exercises.ts` | Five exercise definitions (joints, angle functions) |
| `src/cv/math.ts`, `src/cv/landmarkSmoothing.ts` | Angle math + smoothing helpers |
| `src/cv/calibration.ts`, `src/cv/calibrationStore.ts` | Auto-calibration capture + per-engine/per-side persistence |
| `src/cv/repCounter.ts` | State machine that turns angle travel into reps |
| `src/cv/feedback.ts`, `src/cv/quality.ts` | Movement-depth helpers + calibration-based range score |
| `src/cv/geometryIssues.ts` | Lightweight geometric form checks |
| `src/cv/SkeletonOverlay.tsx` | Bone/skeleton overlay |
| `components/workout/ManualSessionCard.tsx` | Camera-free manual counting UI |
| `src/CvDemoScreen.tsx` | Camera screen orchestrator (calibration, HUD, announcements) |
| `app/(app)/cv-session.tsx` | Session route: engine-accurate sets/reps/sides + completion logging |

## The five families

`squat`, `lunge`, `pushup`, `bicep_curl`, `supported_row`

- **Squat / Lunge** — hip-knee-ankle leg angle.
- **Push-up / Bicep Curl / Supported Row** — shoulder-elbow-wrist arm angle.

## Calibration (auto-capture)

1. **Tap Calibrate.** Hold the **start position**.
2. The system watches the smoothed angle; when you stay still ~2.5 s it captures the **start angle**.
3. Move to the **end position** at your own pace.
4. When you pause, it captures the **end angle** and switches to live rep counting.

Calibration is canonicalized (start = larger angle, end = smaller angle) and
**persisted per exercise + side + pose engine**. Switching between MoveNet and
MediaPipe requires recalibration once, because each engine normalizes
coordinates differently.

Sessions follow engine prescriptions: sets separated by rest timers, bilateral
families (lunges, curls, rows) run both sides, and manual mode records reps
with audio/haptic confirmation when the camera can't be used.

## Rep counting

`repCounter.ts` tracks a state machine over `progress`:

```text
progress = distance from calibrated start toward calibrated end
         = 0 at start pose, 1 at end pose
```

- A fresh counter locks its starting phase from the **first live angle**
  (`primed`). If a session begins while the user is already at the end pose,
  no rep is counted until they return to the start — this prevents the old
  phantom +1 right after calibration.
- A rep registers when the joint reaches the calibrated end (progress ≥ 0.95).
- Returning to the start pose resets for the next rep.
- A 600 ms cooldown prevents double-counting from jitter.

## Range score and skeleton color

- **Green** — the tracked limb is inside the calibrated movement range and
  the rep counter agrees you're mid-movement with good depth.
- **Amber** — between reps, at the range edges, or when a form issue is flagged.

The score (`quality.ts`) is calibration-based and honestly labeled a **range
score**, not a full biomechanical claim. Color has hysteresis to avoid
per-frame flicker.

## Keypoint confidence and smoothing

- `KEYPOINT_MIN_SCORE = 0.45` filters weak detections everywhere.
- MoveNet detection runs every 180 ms; MediaPipe native updates are throttled
  to ~30 fps and smoothed with a missing-landmark hold.
- Keypoints only update React state when they actually move enough.

## Logging & completion

- Camera sessions are logged **once**, by `cv-session`, with reps, range
  score, and issue codes (`source: 'camera'`).
- Manual sessions log from the workout screen (`source: 'manual'`).
- Running/cycling/walking/swimming days record a completed session from the
  Workout screen's Start CTA (`source: 'activity'`).

## Common issues

| Symptom | Fix |
|---|---|
| No skeleton at all | Model still loading, or joints not visible; use the debug panel |
| Only one dot on the hip | Camera framing — full limb in frame, side view |
| Calibration feels wrong after engine switch | Recalibrate under the newly selected engine (keys are engine-scoped) |
| Skeleton flickers | Hysteresis in `CvDemoScreen`; loosen `quality.ts` thresholds if persistent |
| MediaPipe never selected | Requires Android dev build + Profile → Camera Engine → MediaPipe |

## Tunable constants

| Constant | File | Default |
|---|---|---|
| MoveNet detection interval | `usePoseDetection.tsx` | 180 ms |
| `KEYPOINT_MIN_SCORE` | `confidence.ts` | 0.45 |
| Rep thresholds | `repCounter.ts` | 0.95 / 0.05 |
| Rep cooldown | `repCounter.ts` | 600 ms |
| Calibration stability/tolerance | `CvDemoScreen.tsx` | ~2.5 s / 4° |

Real phones differ — tune these on-device, not in theory.

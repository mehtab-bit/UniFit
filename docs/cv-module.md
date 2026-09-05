# CV Exercise Coach — Simple Guide for the Team

This document explains the on-device camera coach end to end: what it
detects, how it counts reps, what the numbers mean, and where each failure
mode is handled. Read `docs/cv-coach.md` for the deep technical detail;
this page is the mental model.

## One-sentence summary

The phone camera → MediaPipe or MoveNet finds your joints → the app measures
one joint angle per exercise → you calibrate your two movement ends once →
each full movement through that range is one rep → reps/scores/feedback are
shown on the phone and only sent to the backend when the session finishes.

## What runs where

```
Native Android build ─ MediaPipe (frame processor, 33 landmarks)
Expo Go / web      ─ MoveNet (bundled TensorFlow.js model)
         |
         v
src/cv/usePoseDetection   (camera frames -> landmarks)
         |
         v
src/cv/useExerciseTracker  (calibration + angle smoothing + rep counter)
         |
         v
src/CvDemoScreen            (coach UI, calibration UI, skeleton overlay)
         |
         v
app/(app)/cv-session        (session state, completion, saving)
```

The camera itself never calls the backend. The backend only receives the
session summary when it finishes (or is saved as a partial).

## The five supported exercises

| Family | Example variation | Tracked joint |
|---|---|---|
| Squat | Chair/bodyweight/loaded | Knee |
| Lunge | Support/bodyweight/loaded | Knee |
| Push-up | Wall/incline/full | Elbow |
| Bicep curl | Water bottle/dumbbell | Elbow |
| Supported row | Support + resistance | Elbow |

Which variation is prescribed comes from the backend plan and the user's
declared equipment. The camera only runs for these five "live" strength
families; other exercises fall back to manual counting.

## Detection pipeline

1. **Camera acquisition** — camera only runs when the screen is focused and
   the app is foregrounded.
2. **Landmarks** — MediaPipe/MoveNet returns joint positions with confidence.
   Low-confidence or missing joints do not become measurements.
3. **Display vs measurement separation** — skeleton overlay uses normalized
   positions for drawing. Angle/geometry math uses an isotropic measurement
   space based on the real frame dimensions so wide/non-square frames are not
   distorted (CV-05).
4. **Smoothing** — landmarks are lightly smoothed for display. A movement is
   only "new" if position *or confidence* changes meaningfully (CV-04).
5. **Session generation tokens** — when you leave, retry, switch sides, or
   change camera facing, old asynchronous model/detector work is invalidated
   and disposed (CV-03). An old session cannot publish landmarks or dispose a
   new detector.

## Calibration

Every exercise needs two poses: **start** (e.g., standing straight) and
**end** (e.g., squat bottom/curl peak).

The app auto-detects stable holds and captures each angle after a stability
dwell. It requires a measurable difference between the two holds (≥5°);
keeping perfectly still will fail calibration instead of creating a useless
"complete" (CV-07). A user with limited range of motion can pass if the two
positions are reliably separated.

Calibrations are saved per exercise + side + engine. Switching engine
(MoveNet vs MediaPipe) requires recalibration.

## Rep counting, quality, and feedback

- A rep is counted when the smoothed joint angle returns to the calibrated
  end of the movement.
- Repetitions are capped to the prescription and side switching resets
  tracking to the newly active limb (CV-01).
- Each completed rep contributes its own range/quality score and issue codes.
  The final session score is the **average of observed reps**, and recurring
  problems are reported rather than the last frame's opinion (CV-09).
- Green skeleton requires a sustained good sequence (about 0.45s); it clears
  after sustained bad evidence (about 0.18s). Missing measurements never
  keep it green (CV-06).
- Custom speech, captions, and haptics are coordinated from one feedback
  owner.

## Session saving and durability

- Full completion, partial exit, and "save partial" all send one logical
  attempt with a stable operation ID.
- If the server cannot be reached, the attempt is stored on-device in a
  per-user queue and replayed when connectivity returns. Replay happens only
  for the same signed-in account (CV-08).
- The user is told "Saved on this device" only after the local durable save,
  not before.

## Known device gaps

- Physical camera/permission/background cycles still need release-device
  evidence (W07).
- Range-score accuracy should be compared against labeled traces before
  treating it as a form/medical signal (W08). It is labeled as a range score,
  not a diagnosis.

## Main files

| File | Role |
|---|---|
| `src/cv/usePoseDetection.tsx` | Camera, model, frames, lifecycle/generation |
| `src/cv/useExerciseTracker.ts` | Side, calibration, angle, rep reducer |
| `src/cv/repCounter.ts`, `calibration.ts`, `math.ts` | Pure rep/calibration logic |
| `src/cv/landmarkSmoothing.ts`, `measurementSpace.ts` | Smooth display + correct measurement coords |
| `src/cv/quality.ts`, `geometryIssues.ts` | Per-frame/per-rep issue evidence |
| `src/cv/NativeCameraFeed.tsx`, `TensorCamera.tsx` | Camera adapters |
| `src/CvDemoScreen.tsx` | Coach UI and session orchestration |
| `app/(app)/cv-session.tsx` | Session wrapper + save/queue integration |

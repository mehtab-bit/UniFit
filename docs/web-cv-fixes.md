# Web CV Fixes

## Overview

This document summarizes the changes made to make UniFit's browser-based computer vision flow fully functional.

The final working flow supports:

- browser camera access
- MoveNet pose detection
- joint/keypoint rendering
- calibration
- rep counting
- shared calibration improvements across web and mobile

## Main Problems Identified

The browser CV pipeline initially failed for multiple reasons:

- the web camera path was not being used correctly
- web was falling through to the old TensorCamera path
- browser TensorFlow needed the `webgl` backend
- MoveNet needed to load from a browser-accessible model path
- browser inference needed a real `HTMLVideoElement`
- keypoints were normalized assuming a fixed 192x192 input
- browser confidence thresholds were too strict
- calibration logic required movement and stability in conflicting stages
- calibration sampling did not collect enough samples during a still hold
- calibration stability checking was too strict for normal webcam jitter
- rep thresholds were too strict

## Files Changed

### `src/CvDemoScreen.tsx`

Changes made:

- added a dedicated web camera path using `WebCameraFeed`
- fixed duplicated/nested `renderCameraFeed()` logic
- ensured web does not fall through to `TensorCamera`
- improved calibration stages:
  - `start_hold`
  - `end_move`
  - `end_hold`
  - `complete`
- changed `end_move` so meaningful movement triggers `end_hold`
- disabled the calibration button while calibration is already running
- suppressed premature calibration quality warnings

### `src/cv/WebCameraFeed.tsx`

New file added for browser camera capture.

Uses:

- `navigator.mediaDevices.getUserMedia()`
- a real `HTMLVideoElement`
- `video.play()`
- `onReady(video)`

This provides a browser-native camera source for MoveNet inference.

### `src/cv/usePoseDetection.tsx`

Major web/native separation added.

Web now uses:

- TensorFlow backend: `webgl`
- MoveNet model path: `/movenet/model.json`
- direct inference on `HTMLVideoElement`
- real browser video dimensions

Native keeps:

- `rn-webgl`
- bundled MoveNet model
- native camera pipeline

### `src/cv/keypoints.ts`

Keypoint normalization was changed from fixed `192x192` assumptions to use the actual source dimensions:

- `sourceWidth`
- `sourceHeight`

This allows correct overlay positioning for browser camera resolutions such as `640x480`.

### `src/cv/confidence.ts`

Platform-specific keypoint thresholds were added.

Approximate thresholds:

- Web: `0.25`
- Native: `0.45`

This allows valid browser webcam keypoints to remain visible while preserving stricter native confidence.

### `src/cv/modelAssets.ts`

Model asset loading was updated so browser builds can use normal `fetch()` instead of native file-system-only loading.

### `src/cv/calibrationStore.ts`

Calibration storage was versioned from:

`@unifit_calibration_v1`

to:

`@unifit_calibration_v2`

Saved calibrations now require a meaningful start/end range.

Old bad calibration values are therefore ignored.

### `src/cv/calibration.ts`

Calibration capture was changed to better handle webcam jitter.

The final logic:

- uses recent valid samples
- requires a minimum number of samples
- removes extreme values where appropriate
- averages the remaining samples

This fixed repeated `Not steady / Recalibrate` failures.

### `src/cv/useExerciseTracker.ts`

Calibration sampling was redesigned.

Previously, samples were effectively collected only when the smoothed angle changed.

Now, during calibration holds, the current angle is sampled on a timer.

This allows stable holds to produce enough calibration samples.

Additional calibration-range validation was also added.

### `src/cv/repCounter.ts`

Rep thresholds were relaxed from near-perfect range requirements.

Changed approximately from:

- end threshold: `0.95` → `0.85`
- return threshold: `0.05` → `0.15`

This makes rep counting more practical for real human movement.

## Final Web CV Pipeline

```text
Browser Camera
    ↓
HTMLVideoElement
    ↓
MoveNet
    ↓
Normalized Keypoints
    ↓
Joint Angle Calculation
    ↓
Calibration
    ↓
Rep Counter

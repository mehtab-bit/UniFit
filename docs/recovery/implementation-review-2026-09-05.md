# UniFit implementation review and improvement roadmap

Reviewed 5 September 2026. Recovery baseline: `166b7d3`. Reviewed HEAD: `d841139`.

## Assessment

The recovery implementation is a meaningful improvement, but it is not yet a completed reliability recovery. Authentication ownership, profile concurrency, persisted plan identity, and real activity/meal records are substantially better. The remaining problems are concentrated at transitions: changing sides, losing a frame stream, pausing, saving after disconnection, replaying operations, changing profiles, and moving between weeks.

A successful walkthrough does not exercise most of those transitions. Passing tests currently give stronger evidence for selected backend rules than for the complete app, live persistence, or camera behavior. Several defects below were reproduced with the current functions or hooks in isolation even though the normal test suites pass.

Preserve the feature set. The recommended structural work strengthens the existing camera coach, plans, logging, and progress experience. There is no evidence here that adding another pose model, more screens, or a wholesale rewrite should be the first step.

## Scope and evidence

- Reviewed the recovery diff (87 files, approximately 7,034 additions and 888 deletions), acceptance documents, and relevant unchanged dependencies in the implementation.
- Followed CV detection, landmark adaptation, smoothing, calibration, tracking, quality, lifecycle, feedback, and completion paths.
- Followed profile/plan generation, snapshots, progression, operation IDs, pending writes, activities, meals, and date selection.
- `npm run typecheck`: passed.
- `npm test`: 45 tests passed in seven files. The recovery did not add frontend test files; these tests do not establish coverage of the new screen/queue/lifecycle flows.
- Isolated backend suite: 46 passed, 13 warnings, using the repository virtual environment with dotenv disabled, development authentication and offline persistence. This does **not** validate production authentication configuration or live Supabase behavior.
- Targeted probes loaded current TypeScript functions with a lightweight transpilation/dependency shim; hook probes simulated state/effect cycles. They are code-level reproductions, not physical camera tests, and are not yet committed regression tests.
- No installed Android release, physical camera, live migration, database outage, production concurrency, or rollback validation was performed in this review.
- No application code was changed. The preexisting untracked `npx` file was left untouched.

Evidence labels below: **reproduced** means an isolated probe demonstrated the behavior; **code-confirmed** means a concrete implementation path establishes the issue; **device validation required** identifies behavior or severity that still needs hardware evidence. P1 means a correctness/data/recovery problem to prioritize; P2 means a material consistency or usability defect.

## What the implementation did well

1. Authenticated routes now verify identity and enforce ownership instead of relying only on supplied user IDs.
2. Profile updates consolidate important fields and use a conditional revision check for concurrent updates. That is a sound foundation to retain.
3. Server-profile plan generation and stored snapshots create a useful basis for consistent plans across screens.
4. Equipment/experience personalization and real activity/meal CRUD replace some shallow paths with actual behavior.
5. Foreground gating, GL cancellation boundaries, and late-model disposal improve specific camera cleanup scenarios.
6. The backend test expansion is valuable. The next investment should test failure semantics and the production persistence adapter as well as the in-memory implementation.

## CV findings

### CV-01 — The second side can still track the first side [P1, reproduced]

Source: `src/cv/useExerciseTracker.ts:21–40`, reset effect through line 71; `app/(app)/cv-session.tsx`.

`activeSide` initializes from `sideOverride` once. Later override changes update a ref, while the side-selection effect returns early whenever an override exists. The reset effect clears tracking but does not update `activeSide`. The session changes sides without changing the component's session key.

Probe: mount with a right-side override, change to left, run effects, rerender: the tracker still reports **right**. A bilateral session can therefore count/assess the wrong limb on its second half.

Fix: one authoritative effective side, with a single transition that resets side-dependent tracking, smoothing, calibration selection, and feedback. Do not retain a second unsynchronized copy of controlled state.

Acceptance: distinct left/right landmark traces; switch mid-session; only the newly selected limb can generate reps or calibration samples. Verify stored progress is attributed to that side.

### CV-02 — An empty MoveNet stream can permanently prevent inference [P1, reproduced]

Source: `src/cv/usePoseDetection.tsx:246–315`.

The hook sets its inference lock before `images.next()`. It clears that lock only inside the `finally` for a nonempty image. An exhausted iterator, or an exception acquiring its next value, escapes that cleanup. A replacement feed then sees inference as permanently busy.

Probe: supply an exhausted iterator, then a valid new iterator, advance the simulated clock 1,000 ms beyond the throttle: **zero new inference calls**.

Fix: cover acquisition and inference with the same `try/finally`; dispose a tensor only if acquired. Give each stream an owned cancellation token and cancel its scheduled animation frame on replacement.

Acceptance: exhausted/throwing iterator, inference failure, foreground return, feed replacement, and repeated retry all recover without restarting the app; at most one active inference loop remains.

### CV-03 — Detector resets do not fully isolate old asynchronous work [P1, code-confirmed; device validation required]

Source: `src/cv/usePoseDetection.tsx`, especially the reset effect and shared active/mode refs.

A shared active boolean can become true for a new run while an older initialization or inference is still finishing. Cleanup also reads mutable mode ownership. Camera facing changes are not represented by the detector reset dependency. Final-unmount disposal is better, but reset/replacement races remain possible.

Fix: assign each detector/stream lifetime a monotonically increasing generation. Capture its resources and owner mode locally. Before publishing any result, verify that generation is current; dispose late-created resources belonging to obsolete generations.

Acceptance: delayed initialization/inference followed by retry, facing change, background/foreground, and exit. Obsolete runs publish no landmarks, errors, or readiness state and dispose only their own resources.

### CV-04 — Display smoothing can conceal measurement invalidity [P1, reproduced + code-confirmed]

Source: `src/cv/landmarkSmoothing.ts:27`, `src/cv/usePoseDetection.tsx`, `src/cv/useExerciseTracker.ts`.

`keypointsMoved` compares coordinates/names but not confidence. Native updates can therefore retain high-confidence tracker input when confidence falls at unchanged coordinates; visible-landmark state is updated separately. The hold smoother also retains missing points temporarily, and angle history is not consistently cleared by tracker reset paths.

Probe: identical coordinates with confidence changing from 0.95 to 0.05 produce `keypointsMoved === false`.

Fix: separate visually smoothed overlay points from eligible measurement samples. Measurements need capture time, confidence/validity, finite coordinates, and a freshness limit. Held display points must not produce reps. Reset phase/smoothing evidence on loss and require fresh reacquisition before counting resumes.

Acceptance: stationary confidence drop, occlusion during descent, delayed frames, missing joints, nonfinite coordinates, and reacquisition cannot complete a rep or capture calibration from stale evidence.

### CV-05 — Native normalized coordinates distort geometry on nonsquare frames [P1, reproduced]

Source: `src/cv/nativePose.ts`, `src/cv/math.ts`, `src/cv/geometryIssues.ts`.

The native adapter forwards normalized x/y into Euclidean angle/distance calculations. MediaPipe normalizes x by image width and y by image height; those are unequal units for nonsquare frames. Frame dimensions exist in the native payload but are not used to establish an isotropic measurement space.

Probe: a point triple gives **90°** in normalized coordinates and **121.3°** after scaling to a 1920×1080 image. This proves the coordinate-space issue; it is not a measured error distribution for actual users. Calibration may absorb some endpoint differences but does not repair geometric cues or all intervening thresholds.

Fix: transform landmarks into a consistent measurement coordinate system using actual frame dimensions and rotation. Keep preview mirroring/cropping separate from measurement geometry. Evaluate world landmarks later where supported and validated; do not switch every rule to 3D without evidence.

Acceptance: the same physical fixture at different aspect ratios and rotations produces equivalent angles and cues after the proper transform. Check native front/back camera orientation on device.

Reference: [MediaPipe Android landmark output](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/android).

### CV-06 — The green-state vote counter is not driven by frames [P2, code-confirmed]

Source: `src/CvDemoScreen.tsx:273–296`.

The effect increments a counter toward three, but depends only on `rawGood` and `isGoodForm`. A stable true input runs once and does not accumulate the remaining votes. The movement predicate also does not establish a meaningful independent range check.

Fix: evaluate a timestamp-based stability latch on each eligible measurement, with explicit valid, invalid, and unknown states. Prefer elapsed time to a fixed frame count so feedback behaves consistently across devices.

Acceptance: a continuous valid sequence reaches green after the intended dwell; sustained invalidity clears it; missing measurements never remain confidently green.

Reference: [React effect dependency behavior](https://react.dev/reference/react/useEffect).

### CV-07 — Calibration does not establish sufficient evidence of a usable range [P1, code-confirmed]

Source: `src/CvDemoScreen.tsx:474–508`, `src/cv/useExerciseTracker.ts:143–166`, `src/cv/calibrationStore.ts`.

End-movement detection checks stability without first requiring meaningful displacement from the start. Capturing the end marks calibration complete without a sufficient-range acceptance rule. The saved-calibration key omits user, variation, and view context; age/context are not used for validity. Sampling driven by changed angle values also differs from collecting a fresh timed hold.

Fix: require fresh timed samples and displacement distinguishable from tracking noise. Validate the two holds and their separation before enabling counting. Respect a user's achievable range: the criterion should be reliable separation, not a universal demand for a larger range of motion. Include subject/variation/view context in calibration identity and perform a quick compatibility check when reusing it.

Acceptance: a no-movement calibration fails with a helpful retry; stable limited-range movement can pass when measurable; changing user/side/variation/view does not silently reuse incompatible calibration. Recalibration preserves completed session work.

### CV-08 — Completion is announced before it is durably saved [P1, code-confirmed]

Source: `app/(app)/cv-session.tsx:149–153,201–215`; workout API completion path.

Partial completion is described as saved before the request resolves. Full completion emits its result before persistence, and both paths navigate back in `finally`, including on rejection. There is no workout outbox equivalent to retain these writes. The manual-fallback transition also does not carry completed camera progress through a shared attempt record.

Fix: persist the attempt locally before acknowledging it. Represent local/pending/synced/failed states truthfully. Retry the same durable attempt ID. Route completion, partial exit, hardware back, and manual continuation through the same attempt coordinator.

Acceptance: network failure, response loss, app restart, repeated finish taps, hardware back, and camera-to-manual continuation preserve exactly the performed work without duplication or a false success message.

### CV-09 — Session quality summarizes a final instant, not the session [P2, code-confirmed]

Source: `src/CvDemoScreen.tsx:368`, `src/cv/quality.ts`, `app/(app)/cv-session.tsx` score aggregation.

The set result supplies the current quality score/issues. Averaging these values across sides does not create a session-wide average. Flat penalties and endpoint state can make the resulting score look more representative than the underlying evidence.

Fix: accumulate per-rep range, valid-observation coverage, and supported issue durations. Summarize only observed evidence and show unavailable when coverage is insufficient. A set-level summary should identify repeated actionable problems, rather than summarize the final camera frame.

Acceptance: a good final frame cannot erase poor or unobserved earlier reps; loss of visibility lowers evidence coverage rather than becoming a fabricated form judgment.

### CV-10 — Camera activity and exercise activity need one lifecycle owner [P1/P2, code-confirmed; device validation required]

Source: `src/cv/NativeCameraFeed.tsx`, `src/cv/native/runtime.ts`, `src/CvDemoScreen.tsx`, detector hook.

Foreground gating now removes the feed, but tracking/calibration/rest state and detector lifetime are controlled separately. Native camera activity is unconditional while mounted, screen focus is not part of the complete policy, and camera errors/readiness are not fully forwarded into the recovery experience. Package presence alone does not prove a working native plugin/model.

Fix: derive acquisition and measurement eligibility from screen focus, foreground state, session stage, and actual detector readiness. Pause intentionally during interruptions, invalidate stale evidence, and provide a recoverable error path. Verify native resource ownership and disposal on hardware; a leak has not been measured in this review.

Acceptance: repeated background/foreground, permission denial/recovery, screen navigation, interrupted calibration, facing changes, and retry return to an intelligible state with no ghost counting or duplicated camera owner.

Reference: [Vision Camera lifecycle guidance for v4.7.3](https://github.com/mrousavy/react-native-vision-camera/blob/v4.7.3/docs/docs/guides/LIFECYCLE.mdx). It documents focus/app-state gating and retaining a warm session with `isActive` during temporary pauses.

## Overall app findings

### APP-01 — Operation identity confuses a repeated activity with a retry [P1, reproduced + code-confirmed]

Source: `app/(app)/activity-session.tsx:154–175`, `app/(app)/workout.tsx`, `backend/services/supabase_service.py:647–675`.

Manual activity IDs use user + activity type + `manual`; separate entries reuse the same ID. Manual workout identity similarly lacks a distinct attempt. The queued activity ID is shared across attempts of the same type. Live activity persistence uses an ordinary insert and reports duplicate failures, while the offline duplicate branch returns the last row rather than the actual matching row.

Probe: independently generated IDs for two manual entries of the same activity are identical. This can reject or collapse legitimate later work, while lost-response retries can fail under live persistence.

Fix: create a durable unique ID once per logical attempt, reuse it only for retries, and distinguish queue ID, entity ID, and operation ID. Return the matching existing result on a same-payload duplicate; explicitly reject conflicting reuse. Apply identical semantics to live and offline adapters.

Acceptance: two genuine entries both survive; replay after lost response produces one result; partial continuation is not mistaken for an already completed independent attempt.

### APP-02 — Pending writes can be lost, and replay is not bound to the original login [P1, reproduced + code-confirmed]

Source: `lib/pendingQueue.ts:33–35,49–55`, `lib/pendingSync.ts:14–49`, `lib/supabase.ts`, auth-triggered sync.

Queue mutations are unprotected read/modify/write operations. Acknowledgment removes every record with a matching ID. The storage wrapper suppresses write errors. Replay receives a user ID but its API calls use the current authenticated session without checking that it is still that user. Login-triggered replay is not a complete connectivity recovery strategy; one permanent error also blocks all later entries.

Probes: two concurrent enqueues retain only **one** operation; acknowledging one of two shared-ID entries removes **both**. Account-switch replay is a code-level race risk, not a reproduced live cross-account write.

Fix: a serialized per-user durable outbox with strict storage failures, unique operation identities, and identity-epoch checks before every replay. Abort on account change. Add foreground/connectivity retry with backoff and distinguish retryable errors from permanent failures. Wire actual workout/meal writes through it where offline durability is promised.

Acceptance: concurrent enqueue/ack, failed local write, restart, account switch during replay, lost response, and an invalid entry followed by a valid one retain correct ownership and data.

### APP-03 — The activity Resume control calls Pause [P2, code-confirmed]

Source: `app/(app)/activity-session.tsx:288`.

When elapsed time is nonzero and the activity is paused, the button says Resume but invokes `pauseTimer` again. It cannot restart normal timing and can alter elapsed accounting.

Fix: explicit timer states and transitions; Resume starts a fresh running segment. Use monotonic elapsed timing where available and define background behavior.

Acceptance: start → pause → wait → resume → finish excludes paused time and resumes ticking exactly once.

### APP-04 — Durable progress is not yet the authoritative input to next week's plan [P1, code-confirmed]

Source: `backend/routes/fitness.py:194`, `backend/services/progression_service.py` including `advance_to_next_week`.

Generation still takes `request.previous_progress`, while normal client generation does not supply authoritative saved progress. Week advancement has no application caller. Restoration and process-local state do not establish a reliable per-user, multi-worker, week-to-week progression lifecycle; persistence failures are not consistently enforced.

Fix: derive engine input from durable user/week state; implement once-only rollover and explicit reconstruction on restart. Query the relevant user's history with pagination rather than relying on a one-time all-user load. Treat failed progression persistence as a failed transition.

Acceptance: complete a week, restart the backend, generate the next week from another worker: the plan uses the same earned progression, once. A later profile edit must not erase it.

### APP-05 — Plan regeneration can rewrite the prescription behind existing work [P1, code-confirmed]

Source: `backend/services/supabase_service.py:295–324`.

Publication supersedes the active week before inserting its replacement, then overwrites scheduled rows keyed by user/date, including dates with existing activity. Those operations are not one atomic activation. Sessions do not retain a sufficient immutable prescription reference to prevent history/denominators changing after a profile edit.

Fix: immutable prescription versions referenced by attempts. Preserve the version attached to completed/in-progress work. Publish a fully persisted replacement transactionally, with a rule preventing competing active versions.

Acceptance: regeneration failure leaves the prior plan active; simultaneous requests select one consistent version; changing a profile does not change what an already completed session was judged against.

### APP-06 — Date selection can show the wrong nutrition or historical plan [P2, reproduced + code-confirmed]

Source: `services/api/combinedPlan.ts:104`, `services/api/mealApi.ts`, `backend/routes/fitness.py` response construction, `backend/routes/workout.py` dated fallback.

Undated meal/nutrition arrays are selected with a fallback to the first day when no explicit date is passed. Some screens request today's values that way. Historical meal selection retrieves the current combined week and matches a weekday; the dated workout fallback does not consistently retrieve a historical snapshot.

Probe: a weekday-only Monday–Sunday array defaults to **Monday** regardless of the intended current day.

Fix: pass explicit local date and week identity end-to-end; stamp all planned sections, not only workouts. Read the matching historical version. Represent genuinely unavailable history as unavailable rather than using another week's same weekday or a generic plan.

Acceptance: Wednesday, Sunday→Monday, a past week, timezone boundaries, and profile regeneration all select the expected date/version across Home, Food, Workout, and Calendar.

### APP-07 — Recorded activities and progress summaries use different definitions [P2, code-confirmed]

Source: activity-log persistence, progression/calendar aggregation, workout completion paths.

Standalone activity records feed activity summaries but do not consistently feed calendar/progression/streak calculations. Some completion views use existence of a session rather than its relation to a scheduled obligation; attempt counts can also be presented as completed-workout counts.

Fix: define one rollup from immutable scheduled obligations and their attempts. Distinguish partial, completed, and unscheduled work. Establish explicitly which existing activity types satisfy which scheduled obligations; do not make every arbitrary log count as a scheduled workout.

Acceptance: partial/zero work, repeated attempts, a scheduled cardio activity, and an unscheduled manual entry produce consistent, explainable totals on every screen.

### APP-08 — Some backend read failures still become empty or stale data [P1/P2, code-confirmed]

Source: `backend/services/supabase_service.py` profile/snapshot/meal/activity read paths.

Several live read exceptions return a cached profile, `None`, or an empty list. An unavailable database can therefore look like a missing plan or no logged activity. This undermines frontend loading/error improvements.

Fix: typed unavailable errors; preserve cached content only with explicit freshness/source state. Separate an authoritative empty result from a failed read.

Acceptance: database outage never creates a false zero, silently resets a profile, or triggers replacement-plan generation solely because the snapshot read failed.

### APP-09 — Shared plan caching is only part of cross-screen consistency [P2, code-confirmed]

Source: `services/api/combinedPlan.ts:22–87` and screen consumers.

The shared store is primarily a promise cache. Its generation bookkeeping does not cancel or prevent an old successful request reaching an already waiting consumer after invalidation, and clearing the entry resets the generation basis. Consumers do not uniformly enforce current user/revision/date ownership.

Fix: versioned request identity and observable shared plan state. Discard results that no longer match the active user, week, and profile revision before publication or screen consumption.

Acceptance: delay request A, edit profile, finish request B, then finish A: every screen stays on B. Repeat across sign-out/sign-in.

### APP-10 — Personalization and acceptance claims still exceed the verified wiring [P2, code-confirmed]

The exercise-restriction field does not reach the engine's effective profile context. Combined accessibility presentation also remains incomplete according to the implementation evidence index. These should have an explicit supported behavior or an honest unhandled disposition, rather than appearing to affect planning when they do not.

The evidence index itself has duplicate/stale W05 entries and pending W08/W11/W12/W13 evidence. A release checklist is useful but is not evidence that the release gate passed. Replace blanket assurance statements with precise checked claims and remaining gaps.

## Recommended CV improvement sequence

| Order | Work package | User-visible benefit | Completion evidence |
|---|---|---|---|
| 1 | Correct side ownership, coordinate transforms, freshness/validity gating | Counts the intended movement consistently | Landmark replay fixtures for side, aspect ratio, missing joints and confidence changes |
| 2 | One detector/session lifecycle with generation cancellation | Camera recovers from interruption without reopening the app | Automated delayed-work tests plus repeated physical Android interruption cycles |
| 3 | Durable attempt coordinator shared with manual continuation | Work survives failed saves and switching input method | Offline/restart/retry/partial-exit tests with exact persisted totals |
| 4 | Evidence-based calibration and contextual reuse | Less repeated setup, fewer misleading successful calibrations | No-motion rejection, measurable limited-range acceptance, context-change tests |
| 5 | Per-rep quality aggregation and phase-aware cues | Feedback explains recurring problems instead of reacting to the last frame | Known traces with expected coverage, excursions and cue timing |
| 6 | Feedback timing and accessible equivalence | Coach is easier to follow while moving | Device checks with captions, speech, haptics, and a screen reader |
| 7 | Measured performance tuning | Consistent responsiveness over a full session | Release-device measurements after correctness fixes |

The useful structural boundary is:

`camera adapter → timestamped measurement → validity/geometry → calibration + rep reducer → session coordinator → durable attempt`

The overlay can consume a separately smoothed representation. Feedback should consume coach events rather than independently infer success from screen state. This keeps one source of truth without turning the module into a large framework.

For deeper coaching within the existing feature set:

- Use explicit measurement timestamps in the pure rep reducer. Avoid separately evaluating time-dependent updates twice. Build deterministic replay before tuning thresholds.
- Validate cues by exercise variation and camera view. Generic torso-lean or body-line rules should be suppressed where the view/variation cannot support them, rather than issuing confident corrections.
- Prioritize one sustained actionable cue at a time. Short rep counts during movement; fuller feedback during rest. Current rep/range/correction speech can be excessive and may overlap accessibility announcements.
- Make captions communicate the same actionable correction as audio. Have one speech owner so custom speech and screen-reader announcements do not compete.
- Preserve completed work during recalibration, detector retry, and manual continuation. Recovery should resume from a clear stage with fresh evidence.
- Instrument actual capture/inference age, processed/dropped frames, visibility loss, reset reason, and persistence state. Existing diagnostic state such as frame counters is not fully updated. Sample telemetry; avoid per-frame React renders or logs merely to observe the loop.
- Measure count error against labeled traces, invalid-count rate during occlusion, recovery success, cue latency, and sustained release-device performance. Choose thresholds from fixtures and device evidence, not an arbitrary promise of high accuracy.

## App-wide implementation order

1. **Protect recorded work:** repair attempt identity, queue serialization/ownership, live idempotency, CV save acknowledgment, and timer resume. These are bounded fixes with clear failure tests.
2. **Make CV measurements trustworthy:** correct side, geometry, freshness, and lifecycle together before retuning calibration/quality.
3. **Make plans/history coherent:** immutable prescription references, atomic activation, explicit dates, authoritative progression, consistent rollups.
4. **Finish existing experience quality:** calibration reuse, helpful recovery, restrained feedback, accessibility wiring, and honest unavailable states.
5. **Close the release evidence gaps:** run the installed Android build and live persistence checks, then record results against the recovery acceptance criteria.

Avoid rebuilding the whole app at once. Each package should preserve the current feature inventory, include a failing regression that represents the defect, and demonstrate a complete user journey after the fix.

## Required validation before calling the recovery complete

- Commit the reproduced probes as proper regression tests in the appropriate existing test setup; add focused hook/queue/session integration coverage where pure CV tests cannot observe the behavior.
- Exercise real persistence in an isolated database: duplicate operations, concurrent plan generation, failed publication, revision conflicts, restart reconstruction, and historical immutability. Do not assume the in-memory adapter has equivalent semantics.
- Test an installed Android release with both available pose paths, front/back camera, permission refusal and recovery, low visibility, side change, background/foreground, repeated retry, and full-length sessions. Record device/build identifiers and outcomes.
- Test local-storage failure, offline completion, lost server response, app restart, and account change during queued replay.
- Check screen-reader/audio/caption behavior during actual exercise, not only while browsing settings.
- Update the acceptance index with verified outcomes and remaining limitations. W07 lifecycle work and a W13 checklist should not be interpreted as proof that all camera reliability and release acceptance work is finished.

**Decision:** retain the recovery foundation and continue with targeted structural repairs. The highest-value next work is correctness at state transitions and durable recording, followed by calibration and feedback depth. More features would not address the failures identified here.

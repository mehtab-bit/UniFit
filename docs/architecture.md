# UniFit Architecture

> Where every piece lives, how it talks to the others, and why it is shaped this way.

## System at a glance

```text
                 Expo React Native app (TypeScript, deep-frontend UI)
                 Expo Router screens · context providers
                 services/ API layer · src/cv pose pipeline
                     |  HTTP/JSON           | on-device
                     v                      v
                 FastAPI backend      Pose engines (selectable):
                 /api/v1              ├─ native MediaPipe (Android dev builds)
                                      └─ TensorFlow.js MoveNet (all builds)
                     | Python calls
                     v
                 vijul engine (pure Python)  ← CSV rule DBs (data/)
                     | persistence
                     v
                 Supabase (auth, profiles, plans, sessions)
```

Three subsystems are deliberately separated:

1. **Frontend app** (this repo) — the adopted deep-frontend UI, onboarding
   quiz, workout & nutrition screens, Profile → Camera Engine selection, and
   the computer-vision coach.
2. **Backend** (`backend/`) — a thin FastAPI service that turns engine
   functions into versioned HTTP endpoints and persists state.
3. **Engine** (`engine/`) — the "vijul" Python fitness engine: pure,
   deterministic plan generation driven by CSV rules. No HTTP, no UI, no DB
   of its own.

The CV coach is fully on-device and never calls the backend per frame. It
reports completion through the normal workout-log API exactly once per camera
session (`cv-session` owns the log call) and, if offline, stores the attempt
in a per-user on-device queue for replay.

## Frontend layer map

| Path | Responsibility |
|---|---|
| `app/` | Expo Router routes: `(app)` tabs, `(auth)` stack, `quiz`, `onboarding`, `cv-session`, `cv-native-test` |
| `components/` | Reusable UI (streak, workout, nutrition, quiz steps, animations, `ui/*` surface components) |
| `context/` | `AuthContext`, `AccessibilityContext`, `AnimationContext`, `SurfaceContext` (light/dark surfaces) |
| `services/` | Data access: `api/` calls FastAPI, `mock/` offline fallbacks, `types.ts` service contracts |
| `lib/` | Supabase client + profile persistence/mapping |
| `src/cv/` | Pose detection (MediaPipe/MoveNet), tracking, rep counting, calibration, quality, skeleton overlay |
| `plugins/withPoseLandmarker.js` | Expo config plugin generating the native MediaPipe frame-processor |
| `utils/`, `hooks/`, `constants/`, `types/` | Helpers, theme, shared types |

**Home data flow:** screen → `useAuth().user.id` → `workoutService.getWeeklyPlan(userId)` → one POST to `/api/v1/fitness/weekly-plan` with the user's real engine profile. The response (7 days × workouts/nutrition/meals) is cached in memory per user, and every service reads from that same combined plan rather than hitting separate endpoints.

### Why the data flow is what it is

- The engine is **profile-driven**: age/sex/height/weight/goal/lifestyle/diet/
  preferences decide the week. Plans are generated from the committed server
  profile (`GET/PUT /api/v1/profile/me`), not from client defaults.
- The engine is **progression-driven**: completing workouts writes `user_workout_sessions`; the backend recomputes rule weeks and variation levels from that history.
- Weekly completion is judged against the issued plan, not merely averaged
  over submitted logs.
- Plans are **snapshotted** (`user_plan_snapshots`, `scheduled_workouts`) with
  profile/progression revisions and stable per-date IDs. Older snapshots are
  superseded, not deleted.
- Meals and guided/manual activities are first-class records
  (`meal_log_entries`, `user_activity_logs`) with CRUD and idempotent writes.

## Pose engines

- **MoveNet Lightning (TensorFlow.js)** — bundled model assets, runs in every
  build including Expo Go and web. Input frames are 192×192; keypoints are
  normalized and confidence-filtered.
- **Native MediaPipe PoseLandmarker (Vision Camera v4)** — Android
  development builds only. Detection runs in the frame-processor plugin;
  landmarks bridge back to JS and are smoothed there.
- **Selection** — Profile → Camera Engine persists Auto / MediaPipe / MoveNet
  per device (`src/cv/native/runtime.ts`). MediaPipe is only used when the
  native plugin is available; otherwise MoveNet is the fallback.
- **Calibration** — stored per exercise + side + **engine**, so a MoveNet
  calibration never leaks into MediaPipe (or vice versa).

## Backend layer map

| File | Role |
|---|---|
| `backend/main.py` | FastAPI app, CORS, exception handlers, mounts routers under `/api/v1` |
| `backend/routes/*.py` | HTTP endpoints (fitness, workout, nutrition, meals, activity, completion, progress, calendar, profile, health) |
| `backend/schemas/*.py` | Pydantic contracts (mirrored by `types/domain.ts`) |
| `backend/services/engine_service.py` | Adapts engine functions into service methods |
| `backend/services/progression_service.py` | Plan-denominator summaries, 80% gates, progression state |
| `backend/services/supabase_service.py` | Supabase persistence + thread-local clients + typed unavailable errors |
| `lib/pendingQueue.ts` / `pendingSync.ts` | Per-user durable offline queue for activity/camera writes |

**Canonical endpoint:** `POST /api/v1/fitness/weekly-plan` returns workouts +
nutrition + meals for a whole week in one call. The frontend routes through it.

**Honesty rule:** streaks, progress, and activity are computed from real
`user_workout_sessions` — never fabricated. New users see zeros until they log
a workout. Completion `source` is `camera`, `manual`, or `activity` (cardio
days recorded from the Workout screen).

## The quiz → plan → progression loop

```text
Quiz (12 steps) ──► AuthContext.submitQuizProfile ──► profiles (Supabase)
       │                                                     │
       │  clears cached plan + bumps profileRevision          │
       ▼                                                     ▼
Home ──► workoutService.getWeeklyPlan(userId) ──► FastAPI ──► engine
                                                              │
                                          generates full week (3-5 active days)
                                                              │
                                          caches in user_weekly_plans
                                                              ▼
Workout screen ──► cv-session (on-device pose tracking) ──► reps + range score
   │                                                          │
   └─ cardio/interval days: record as completed                │
                                                              ▼
                          POST /api/v1/workout/complete ──► progression engine
                                                              │
                                          logs session, updates rule weeks/levels
                                                              ▼
                                  next getWeeklyPlan returns the next week's plan
```

## Data model (core tables)

| Table | Purpose |
|---|---|
| `profiles` | Quiz answers / user baseline (one row per auth user) |
| `user_activity_preferences` | Preferred cardio activities |
| `user_weekly_plans` | Legacy combined plan cache |
| `user_plan_snapshots` | Revision-aware plan snapshots per user/week |
| `scheduled_workouts` | Stable scheduled-workout identities/dates |
| `user_workout_sessions` | Completion log (feeds streaks + progression) |
| `user_progress_state` | Progression snapshot (rule weeks, variation levels) |
| `meal_log_entries` | Logged planned/database/custom food entries |
| `user_activity_logs` | Guided/manual walking/running/cycling/swimming entries |
| Engine CSVs (`data/`) | Workout templates, exercise variations, schedule/progression/accessibility rules |

## Git / environment notes

- Final integrated branch: **`main`** (deep-frontend UI + CV coach + backend/engine).
- The engine reads CSVs from `data/`; the service layer patches its paths at import so it runs from any working directory.
- Full setup and run steps: see `docs/setup.md`.

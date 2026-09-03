# UniFit Architecture

> Where every piece lives, how it talks to the others, and why it is shaped this way.

## System at a glance

```text
                 Expo React Native app (TypeScript)
                 Expo Router screens · context providers
                 services/ API layer · src/cv pose pipeline
                     |  HTTP/JSON           | on-device
                     v                      v
                 FastAPI backend      TensorFlow.js MoveNet
                 /api/v1               (runs on the phone)
                     | Python calls
                     v
                 vijul engine (pure Python)  ← CSV rule DBs (data/)
                     | persistence
                     v
                 Supabase (auth, profiles, plans, sessions)
```

Three subsystems are deliberately separated:

1. **Frontend app** (this repo) — UI, onboarding quiz, workout & nutrition screens, and the computer-vision coach.
2. **Backend** (`backend/`) — a thin FastAPI service that turns engine functions into versioned HTTP endpoints and persists state.
3. **Engine** (`engine/`) — the "vijul" Python fitness engine: pure, deterministic plan generation driven by CSV rules. No HTTP, no UI, no DB of its own.

The CV coach is the exception: it is **fully on-device** and never calls the backend per-frame (privacy, offline, latency). It reports completion through the normal workout-log API.

---

## Frontend layer map

| Path | Responsibility |
|---|---|
| `app/` | Expo Router routes (`(app)` tabs, `(auth)` stack, `quiz`, `onboarding`, `cv-session`) |
| `components/` | Reusable UI (streak, workout, nutrition, quiz steps, animations) |
| `context/` | `AuthContext` (session/profile/onboarding), `AccessibilityContext` (speech/captions/haptics), `AnimationContext` |
| `services/` | Data access: `api/` calls FastAPI, `mock/` offline fallbacks, `types.ts` service contracts |
| `lib/` | Supabase client + profile persistence/mapping |
| `src/cv/` | Pose detection, tracking, rep counting, form quality, calibration, skeleton overlay |
| `utils/`, `hooks/`, `constants/`, `types/` | Helpers, theme, shared types |

**Home data flow:** screen → `useAuth().user.id` → `workoutService.getWeeklyPlan(userId)` → one POST to `/api/v1/fitness/weekly-plan` with the user's real engine profile. The response (7 days × workouts/nutrition/meals) is cached in memory per user, and every service reads from that same combined plan rather than hitting separate endpoints.

### Why the data flow is what it is

- The engine is **profile-driven**: age/sex/height/weight/goal/lifestyle/diet/preferences decide the week. Quiz answers are saved to `profiles` and re-sent with each plan request.
- The engine is **progression-driven**: completing workouts writes `user_workout_sessions`; the backend recomputes rule weeks and variation levels from that history.
- Plans are **cached** (`user_weekly_plans`) and regenerated when a profile changes (the app passes `force_regenerate` after quiz edits) or the cache is invalidated.

---

## Backend layer map

| File | Role |
|---|---|
| `backend/main.py` | FastAPI app, CORS, exception handlers, mounts routers under `/api/v1` |
| `backend/routes/*.py` | HTTP endpoints (fitness, workout, nutrition, meals, completion, progress, profile, health) |
| `backend/schemas/*.py` | Pydantic contracts (mirrored by `types/domain.ts`) |
| `backend/services/engine_service.py` | Adapts engine functions into service methods |
| `backend/services/progression_service.py` | Session logs, 80% gates, rule-week progression |
| `backend/services/supabase_service.py` | Supabase persistence + in-memory caches when offline |

**Canonical endpoint:** `POST /api/v1/fitness/weekly-plan` returns workouts + nutrition + meals for a whole week in one call. The frontend routes through it.

**Honesty rule adopted in this codebase:** streaks, progress, and activity are computed from real `user_workout_sessions` — never fabricated. New users see zeros until they log a workout.

---

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
Workout screen ──► cv-session (on-device pose tracking) ──► reps + form score
                                                              │
                                                              ▼
                          POST /api/v1/workout/complete ──► progression engine
                                                              │
                                          logs session, updates rule weeks/levels
                                                              ▼
                                  next getWeeklyPlan returns the next week's plan
```

---

## Data model (core tables)

| Table | Purpose |
|---|---|
| `profiles` | Quiz answers / user baseline (one row per auth user) |
| `user_activity_preferences` | Preferred cardio activities |
| `user_weekly_plans` | Generated combined plan cache per user/week |
| `user_workout_sessions` | Completion log (feeds streaks + progression) |
| `user_progress_state` | Progression snapshot (rule weeks, variation levels) |
| Engine CSVs (`data/`) | Workout templates, exercise variations, schedule/progression/accessibility rules |

---

## Git / environment notes

- Active development branch: `merge-cv` (based on `deep-onlyfrontend`); original prototype preserved on `cv-snapshot`.
- The engine reads CSVs from `data/`; the service layer patches its paths at import so it runs from any working directory.
- Full setup and run steps: see `docs/setup.md`.

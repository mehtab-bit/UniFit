# UniFit Recovery — Architecture & Contracts

Status: living document for the `codex/recovery` implementation.

## Ownership

| Concern | Owner |
|---|---|
| Identity | Supabase Auth; verified by FastAPI (`Authorization: Bearer`) |
| Committed profile | Database through `GET/PUT /api/v1/profile/me` |
| Workout/nutrition/meal prescriptions | Python engine (`engine/`) |
| Plan versions/scheduled dates | Backend + `user_plan_snapshots`/`scheduled_workouts` |
| Actual session/meal/activity records | Database |
| Camera frames/detection/rep state | Device |
| Screen rendering | Frontend |
| Demo data | Only when `EXPO_PUBLIC_DEMO_MODE=true` and explicit demo account is used |

## Identity rules

- Backend reads identity from the verified JWT, never from a caller-supplied `user_id`.
- `user_default` is a legacy placeholder and maps to the verified user in live mode; a real foreign UUID is rejected with 403.
- `UNIFIT_AUTH_MODE=dev` exists only for offline engine tests/development; production deployments require `SUPABASE_JWT_SECRET`.

## Profile contract

- `GET /profile/me` returns the committed profile or 404.
- `PUT /profile/me` accepts all onboarding fields atomically, including `preferred_activities`, `accessibility_needs`, `blind_low_vision_resources`, equipment, experience, restrictions, and notes.
- Every successful write increments `profile_revision`.
- `expected_profile_revision` mismatches return 409; a retake cancellation never commits incomplete data.
- Incomplete profiles never receive fabricated default demographics or a personalized-looking plan.

## Plan identity

- Plan snapshot identity = `(user_id, week_start_date (Monday), profile_revision, progression_revision, engine_version, rule_data_version)`.
- A new profile revision supersedes the active snapshot for unstarted weeks; completed history and active-session prescriptions are never regenerated.
- Each scheduled workout carries a deterministic `scheduled_workout_id = uuid5(unifit://scheduled/{user}/{local_date})` and a `local_date`.
- The frontend asks through one shared plan store (`services/api/combinedPlan.ts`); every screen observes the same revision.
- API failures propagate: no mock plans substitute for server content.

## Session contract

- Recording payloads carry `operation_id` (stable across retries), `scheduled_workout_id`, `local_date`, timestamps, source, measured duration, reps/sets/sides, and optional range score/issues.
- Retrying one `operation_id` creates one record (`duplicate=true`).
- A success response means the row committed; otherwise the client keeps its pending record.
- Completion is never broadcast before durable confirmation.

## Progression rules

- Weekly completion is calculated against the issued plan's scheduled obligations, including unattempted obligations at week close.
- Repeated attempts roll up to one scheduled workout and are capped at 100%.
- Adherence uses distinct active days against the actual issued due schedule, never a fixed four-day target.
- The 80% gate remains authoritative in the engine; `progression_revision` changes every state transition.
- After the validated eight-week rule range, the final validated prescription holds.

## Dates

- Store UTC timestamps with user-local `local_date` keys for scheduled work, sessions, meal logs, and calendars.
- Weeks start Monday and are represented by their Monday date.
- Unknown duration/distance/calories/fibre/carbs stay unknown; `NaN` denominators are guarded.

## Migration order (apply in this order on live Supabase)

1. `20260905000002_profile_contract.sql`
2. `20260905000003_plan_identity.sql`
3. `20260905000004_session_idempotency.sql`
4. `20260905000005_meal_logs.sql`

All existing migrations (`...00/01`) are already applied.

## Rollback

Rollback is app-release + backend compatible: old app builds continue to use legacy inline-profile plan requests and caller ids only in dev mode; live mode requires the same signed-in account and accepts `user_default` as a no-op placeholder. New tables/columns are additive. To roll back code, reverse commits on `codex/recovery` or reset the deployed backend to `main`; databases keep additive schema (never destructive).

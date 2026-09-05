# UniFit Recovery — W00 Feature & Evidence Inventory

Status: **living document** — updated as implementation packages land.
Baseline commit: `166b7d3` (`fix: exclude test caches from EAS archive; pin local app versioning`)
Branch: `codex/recovery`
Baseline date: 2026-09-05 (Asia/Calcutta)

## Baseline verification (recorded before any change)

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | Pass | TypeScript strict, no emit |
| `npm test` | 45 passed (7 files) | `src/cv/__tests__/*` |
| `pytest backend/tests` | 7 passed, 5 failed | Failures occur only when live Supabase credentials are present: tests use non-UUID user ids (`test_veg_user`, etc.) and the service rejects them. Environment-dependent defect; fixed under W01. |
| Untracked `npx` file | Preserved | Not generated cleanup; kept untouched. |

## Repository inventory

### App (Expo Router)

| Route | Purpose | State summary (code inspection) |
|---|---|---|
| `index`, `splash`, `onboarding` | Entry gating, intro tour | Partially working; auth gating and demo semantics need W01 review |
| `(auth)/login`, `signup`, `forgot-password` | Supabase or local demo auth | Real flows exist; local demo auth is implicit in dev; no password-recovery callback flow |
| `quiz` + `components/quiz/*` | 14-step onboarding assessment | Functional collection; save path swallows DB errors and can fabricate success |
| `(app)` tabs: `index` (Home), `activity`, `food`, `progress`, `profile` | Primary experience screens | Wire real combined plan only through workout/food mappers; several fallback constants and invented metrics remain |
| `(app)/workout` | Workout detail / manual session | Uses week-1 combined plan and default-user fallbacks; date/day logic ignores signed-in user identity |
| `(app)/cv-session`, `cv-native-test`, `performance-test` | Camera coach + diagnostics | Camera lifecycle must be hardened (W07); completion flow must be durable (W05) |

### Services / data access

- `services/api/*`: typed clients to FastAPI. Several swallow failures (`console.warn` + mock/empty fallback): `workoutApi`, `mealApi`, `activityApi`, `nutritionApi`, `streakApi`, `progressApi`.
- `services/api/combinedPlan.ts`: user+week-only cache; no profile-revision awareness; used by workout/meal/nutrition flows.
- `lib/profile.ts`: reads `profiles` directly from Supabase client and local cache; swallows errors; maps demo defaults into missing fields; splits activity rows without atomic commit.
- `context/AuthContext.tsx`: awaits profile fetch inside `onAuthStateChange` (deadlock risk documented by Supabase); local demo session semantics diverge from live.

### Backend (FastAPI)

| Route | Owner concern | Defect/notes |
|---|---|---|
| `GET /api/v1/health` | liveness | Reports `database_connected` from client init only; not dependency readiness |
| `POST /profile/preview` | engine preview | Saves profile when `user_id` supplied; unauthenticated |
| `POST /fitness/weekly-plan` | combined plan | Unauthenticated; trusts `user_id`; caches by user+week only; can return cached content from an older profile |
| `GET /workout/{date}`, `/nutrition/{date}`, `/meals/{date}` | per-day slices | Unauthenticated; default-user fallback plan generation when no cache |
| `POST /workout/complete` | completion | Unauthenticated; caller supplies identity; success returned even when persistence failed |
| `GET /streak`, `/progress`, `/sessions` | summaries | Unauthenticated; process-local progression; weekly adherence divides by fixed 4 |
| `POST /meals/weekly`, `/nutrition/weekly`, `/workout/weekly` | legacy weekly endpoints | Unauthenticated; duplicates combined generation |

### Services (backend)

| Service | State |
|---|---|
| `supabase_service` | Process-local cache + live Supabase writes; write errors are printed and swallowed (`save_profile`, `cache_weekly_plan`); uses a service-role-style key when available |
| `progression_service` | Authoritative summary math delegated to engine, but state is process-local and rebuilt from session rows without plan/week reconstruction; `advance_to_next_week` has no route caller |
| `engine_service` | Thin wrapper; no profile validation beyond engine; passes single `accessibility_id` |

### Engine (`engine/`, pure Python)

Workout engine supports: schedule rules by lifestyle, rule weeks capped at 8, 80% gates, strength variation levels per family, blind/low-vision adaptations by declared resource, deaf/HoH presentation, `accessible_cardio` fallback, explicit `accessibility_unavailable_slots`.
Meal planner supports diet tags, portion steps (0.25), carbohydrate/fibre completeness flags, deterministic ranking (top-36 base candidates retained; full combination set is not persisted).

### Supabase migrations

| Migration | Purpose |
|---|---|
| `20260903000000_initial_schema.sql` | Dynamic user tables, static seed tables, RLS |
| `...01_seed_data.sql` | Static engine data (foods, meals, meal items, activities, templates, variations, schedule/progression rules) |
| `...02` | `profiles.blind_low_vision_resources` |
| `...03` | `user_workout_sessions.source`, `.reps_completed` |
| `...04` | `.range_score`, `.issue_codes` |
| `...05` | `.exercise_completion_pct` |

All existing migrations are already applied to the live project (user-confirmed).

## Intended-feature coverage summary

Every intended feature from the PLAN is retained. The recovery does **not** remove: personalized workout/nutrition/meal plans, quiz/onboarding, progression, camera coaching, manual sessions, activity tracking (walk/run/cycle/swim with guided sessions, timers, manual entries), calendar, notes, accessibility, or meal logging. GPS, barcode, image recognition, and external food DBs remain explicitly out of scope.

| Feature | Work package | Baseline status |
|---|---|---|
| Secure identity & account data ownership | W01 | Defective (no backend verification) |
| Onboarding persistence & truthful saves | W02 | Defective (false success, defaults, partial persistence) |
| Plan identity, snapshots, refresh | W03 | Defective (user+week cache only) |
| Engine personalization (equipment/experience/accessibility matrix) | W04 | Partial (engine has rules; frontend drops several inputs) |
| Durable, idempotent session saving | W05 | Defective |
| Progression & historical summaries | W06 | Defective |
| Android camera/workout lifecycle | W07 | Unverified on device; TS lifecycle gaps |
| Coaching usefulness & manual parity | W08 | Unverified on device |
| Guided/manual activity tracking | W09 | Defective |
| Food & meal logging | W10 | Missing (no log storage or UI) |
| Layout/navigation/accessibility | W11 | Partial; needs native verification |
| Performance/diagnostics/deploy | W12 | Partial |
| Migration, regression, pilot completion | W13 | Not started |

Nothing may be marked "working" solely because it renders; statuses above are based on repository evidence and the user's manual device verification remains the final gate for camera/device items.

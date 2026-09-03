# The Vijul Fitness Engine

> The "brain": how a profile becomes a personalized week, how meals and nutrition are derived, and how progression works.

## What the engine is

`engine/` is a set of **pure Python modules** (no HTTP, no database, no UI). It reads deterministic rule tables from CSV files under `data/` and produces:

- a 7-day workout plan (which days are active, strength vs. cardio, which exercises),
- daily nutrition targets (calories, protein, carbs, fat, fibre),
- a portion-scaled meal plan,
- progression decisions (when to advance an exercise to the next level).

The FastAPI backend (`backend/`) wraps these functions and exposes them over HTTP. `backend/services/engine_service.py` patches the engine's data paths at import so it works from any working directory.

## Engine modules

| Module | Responsibility |
|---|---|
| `weekly_workout_engine.py` | Weekly schedule, strength session building, progression rules, accessibility routing. The biggest module and the source of the workout plan. |
| `nutrition_targets.py` | Baseline BMR (Mifflin-St Jeor) and macro targets from a profile. |
| `daily_targets.py` | Per-day nutrition targets that account for the day's workout. |
| `weekly_targets.py` | Whole-week nutrition consumed against the workout plan. |
| `weekly_meal_planner.py` | Portion-scaled meal plan from the food database. |

The CSV data lives in `data/workouts/` (schedule/template/progression/accessibility rules) and `data/processed/` (foods/meals). The seed/migration scripts under `supabase/` and `scripts/` turn these CSVs into Supabase tables and were used to build the repo's data.

## Profile → plan (the inputs)

The engine needs a normalized profile. `lib/profile.ts` (`toEngineRequestPayload`) produces it from quiz answers:

```json
{
  "age": 23, "sex": "male", "height_cm": 170, "weight_kg": 50,
  "fitness_goal": "muscle_gain", "lifestyle_activity": "sedentary",
  "diet": "non_vegetarian",
  "preferred_activities": ["running", "cycling"],
  "accessibility_needs": ["none"],
  "strength_equipment": ["no_equipment"],
  "strength_experience": "new"
}
```

`lifestyle_activity` decides active-days-per-week. `fitness_goal` adjusts nutrition targets. `preferred_activities` and accessibility options decide cardio sessions. Equipment/experience are carried in the payload and used by the exercise variation rules where applicable.

## Plan generation (the output)

`POST /api/v1/fitness/weekly-plan` (combined endpoint) runs the full pipeline and returns one object with:

- `workouts` — 7 day objects; each active day has a session with `exercises`, each exercise carrying name, family, variation level, sets/reps/rest, form cues, accessibility text.
- `nutrition` — per-day targets.
- `meals` — per-day meals with scaled portions.
- `progression_decisions`, `strength_exercise_decisions` — what changed this week.

Different profiles produce materially different weeks — e.g. a sedentary beginner gets ~3 active days with walking; a very active athlete gets ~5 days across running/cycling/swimming, with far higher calorie targets.

## Progression (80% rule)

`backend/services/progression_service.py` and the engine together implement the progression gate:

1. When a session completes, `POST /api/v1/workout/complete` logs it with per-exercise completion percentages.
2. The backend recomputes weekly completion and checks whether an activity/exercise family reached **80% completion**.
3. Rule weeks and strength variation levels advance only when the gate passes.
4. The next plan fetch uses the updated state, so the plan progressively intensifies.

Session logs persist in `user_workout_sessions`; a snapshot lives in `user_progress_state`. On backend restart, history is reloaded so progression isn't lost.

## Nutrition formulas

- **BMR** — Mifflin-St Jeor from age/sex/height/weight.
- **Maintenance** — BMR × activity factor (sedentary 1.2 … very active 1.725).
- **Goal adjustment** — fat loss ≈ ×0.82, maintain ×1.0, muscle gain ×1.12.
- **Protein** — grams per kg of body weight based on goal; carbs/fat fill remaining calories.

The offline fallback mocks implement the same rough math so screens still show sensible targets when the backend is unreachable.

## Running the engine alone

```bash
# from the repo root, inside the venv
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

Interactive docs: http://localhost:8000/docs

Or import modules directly for experimentation:

```python
from engine.weekly_workout_engine import generate_weekly_workout_plan
```

## Tests

- Backend: `pytest backend/tests/test_engine_api.py` (engine-only integration).
- Frontend/CV logic: `npm test` (Vitest) — covers calibration, angle math, feedback, rep counter, side selection, and quality.

## How the engine relates to the CV coach

The engine is the **prescription side**: it decides which family, which variation, and how many reps. The CV coach is the **execution side**: it verifies the movement via the camera. The handshake between them is the family identifier plus the completion payload. See `docs/cv-coach.md`.

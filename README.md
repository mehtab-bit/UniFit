# Inclusive Adaptive Fitness Engine

An inclusive, adaptive fitness and nutrition engine built for the **Smart India Hackathon (SIH)** problem statement:

> **Student Innovation — Ideas that can boost fitness activities and assist in keeping fit**  
> Theme: Fitness & Sports  
> Category: Software

This repository contains the core recommendation engine and seed data for a personalized fitness application that combines:

- lifestyle-aware workout generation
- 8-week adaptive progression
- activity preferences
- mandatory full-body strength training
- completion-based progress/hold logic
- accessibility-aware workout adaptation
- personalized calorie and macro targets
- diet-aware 7-day meal planning
- practical serving-size adjustment

---

## Core Idea

The project is designed around one principle:

**Fitness plans should adapt to the person, not force every person into the same plan.**

A user's plan is influenced by age, sex, height, weight, fitness goal, lifestyle level, preferred activities, diet, accessibility needs, available accessibility resources, and previous workout completion.

The engine then generates a weekly workout plan, calculates day-specific nutrition targets, and builds a 7-day meal plan.

---

## High-Level Architecture

```text
ONBOARDING
│
├── age / sex / height / weight
├── goal
├── lifestyle
├── preferred activities
├── diet
├── accessibility profile
└── accessibility resources
        ↓
WEEKLY WORKOUT ENGINE
        ↓
7-DAY WORKOUT PLAN
        ↓
DAILY COMPLETION RESULTS
        ↓
80% PROGRESSION / HOLD LOGIC
        ↓
DAILY NUTRITION TARGETS
        ↓
7-DAY NUTRITION TARGETS
        ↓
MEAL PLANNER
        ↓
BREAKFAST + LUNCH + EVENING SNACK + DINNER
```

---

## Workout Personalization

### Lifestyle options

```text
sedentary
light
moderate
very_active
```

Lifestyle affects both the starting workload and the number of active/recovery days.

### Preferred activities

Users can select one or more:

```text
walking
running
cycling
swimming
```

### Strength is automatic

Strength is not an onboarding preference. It is automatically included **2 times per week**.

Each full-body strength session contains:

1. Squat
2. Lunge
3. Push-up
4. Bicep Curl
5. Supported Row

---

## Strength Variations

Strength exercises have progressive versions. Example:

```text
Squat
Level 1 → Chair Squat
Level 2 → Bodyweight Squat
Level 3 → Loaded Squat
```

```text
Push-up
Level 1 → Wall Push-Up
Level 2 → Incline Push-Up
Level 3 → Floor Push-Up
```

Where appropriate, secure household resistance such as water bottles or backpacks may be used.

---

## Running Session Variety

Running is not modeled as continuous running every day. Templates include:

```text
Run-Walk
Easy Continuous Run
Running Intervals
Controlled Tempo Run
```

Walking, cycling and swimming also have multiple session styles.

---

## 8-Week Progression

The prototype uses an 8-week progression model:

```text
Week 1 → starting workload
Week 2 → progression
Week 3 → progression
Week 4 → consolidation / reduced-load week
Week 5 → progression resumes
Week 6 → progression
Week 7 → progression
Week 8 → progression
```

Week 4 is intentionally a consolidation week.

---

## 80% Completion Rule

The engine does not increase every activity automatically.

An activity may progress when:

```text
overall weekly completion >= 80%
AND
that activity's completion >= 80%
```

Otherwise that activity holds its current progression level.

Example:

```text
Overall week = 85%
Running = 72%  → HOLD
Cycling = 92%  → PROGRESS
Strength = 88% → PROGRESS
```

### Independent strength progression

Each strength exercise also progresses independently.

```text
Squat        92.5% → progress
Lunge        87.5% → progress
Push-up      69.0% → hold
Bicep Curl   91.0% → progress
Supported Row 89%  → progress
```

This prevents one difficult exercise from either freezing the full strength plan or being progressed before the user is ready.

---

## Calendar Week vs Progression Rule Week

Calendar week and progression rule week are intentionally separate.

A user can be in Calendar Week 4 while running is still on Rule Week 2 if running did not meet the previous completion threshold.

The backend must therefore persist progression state between weeks.

---

# Accessibility

## Accessibility profiles

```text
none
blind_low_vision
deaf_hard_of_hearing
other
```

Accessibility is used as a planning/presentation input rather than only a profile label.

## Blind / Low-Vision Adaptation

The system does not assume that blind or low-vision users cannot run, cycle or swim. Instead it considers declared resources such as:

```text
safe_indoor_space
stable_support
guide
stationary_bike
accessible_pool_support
```

Examples:

```text
Running preference + guide
→ Guided Run
```

```text
Cycling preference + stationary bike
→ Stationary Cycling
```

```text
Swimming preference + accessible pool/support
→ Supported Accessible Swim
```

If an unsupported route-based option is not appropriate for the declared resources, the engine can use an accessible indoor cardio alternative such as Indoor March or Supported Step-Touch Cardio.

The project does not assume computer vision or automatic rep counting is always available.

## Blind / Low-Vision Strength Guidance

The same five strength exercise families remain in the program. Accessibility-specific guidance can provide audio-friendly instructions, tactile/environmental reference points, stable-support cues and non-visual form descriptions.

The strength exercise database is not duplicated; accessibility guidance links to existing variations.

## Deaf / Hard-of-Hearing Support

The actual exercise prescription does not automatically need to change. The frontend can provide:

- captions
- visual timers
- visual workout instructions
- haptic/vibration cues where implemented

---

# Nutrition Engine

## Baseline targets

The nutrition engine uses adult profile inputs such as:

```text
age
sex
height_cm
weight_kg
goal
lifestyle_activity
diet
```

BMR is estimated using the Mifflin-St Jeor equation. Supported goals are:

```text
fat_loss
maintain
muscle_gain
```

Lifestyle activity is treated as the non-workout baseline. Planned workout energy is added separately.

## Protein rule

The current prototype uses:

```text
minimum = 1.50 g/kg/day
target  = 1.625 g/kg/day
maximum = 1.75 g/kg/day
```

Example for 70 kg:

```text
minimum = 105.0 g
target  = 113.8 g
maximum = 122.5 g
```

Protein stays relatively stable across the week while calories and carbohydrates vary with daily workout load.

## Workout-aware daily nutrition

Conceptually:

```text
baseline maintenance
+
estimated workout energy
+
goal adjustment
=
daily calorie target
```

The engine then calculates protein, carbohydrate, fat and fibre targets.

The nutrition engine uses the **activity actually performed**, not only the user's original preference.

---

# Food and Meal Data

## `foods_100_final.csv`

Master ingredient/nutrition database containing approximately 100 curated foods with:

- food identity and group
- diet compatibility
- meal suitability
- nutrition per 100 g
- protein density
- source metadata
- carbohydrate/fibre reporting status

Supported diet profiles:

```text
vegan
vegetarian
eggetarian
non_vegetarian
```

## `meals.csv`

Meal catalog containing approximately 50 prototype meals across:

```text
breakfast
lunch
evening_snack
dinner
```

Each meal contains calculated nutrition and diet compatibility flags.

## `meal_items.csv`

Bridge table connecting meals to foods and storing ingredient quantities in grams.

```text
foods
  ↑
meal_items
  ↓
meals
```

A base serving means the ingredient quantities currently stored for a meal in `meal_items.csv`.

---

## Serving Sizes

The meal planner uses practical serving increments:

```text
0.75 serving
1 serving
1.25 servings
1.5 servings
1.75 servings
2 servings
2.25 servings
2.5 servings
```

The frontend should show user-friendly labels such as `2 servings`, not optimizer notation such as `x2.0`.

When a meal is scaled, ingredient quantities and nutrition must use the same multiplier.

---

## Missing IFCT Values

Some source food entries do not report carbohydrate or fibre. Missing values must not automatically be converted to zero.

The data layer therefore preserves fields such as:

```text
carbohydrate_status
fiber_status
carbohydrate_complete
fiber_complete
```

---

# Repository Structure

```text
inclusive-fitness-engine/
│
├── engine/
│   ├── __init__.py
│   ├── nutrition_targets.py
│   ├── daily_targets.py
│   ├── weekly_targets.py
│   ├── weekly_workout_engine.py
│   └── weekly_meal_planner.py
│
├── scripts/
│   ├── create_food_database.py
│   ├── inspect_ifct.py
│   ├── extract_ifct.py
│   ├── select_100_foods.py
│   ├── curate_100_foods.py
│   ├── add_carbs_fiber.py
│   ├── build_final_foods.py
│   ├── build_meals.py
│   ├── build_workout_database.py
│   └── build_accessibility_database.py
│
├── data/
│   ├── processed/
│   │   ├── foods_100_final.csv
│   │   ├── meals.csv
│   │   └── meal_items.csv
│   │
│   └── workouts/
│       ├── activities.csv
│       ├── workout_templates.csv
│       ├── exercise_variations.csv
│       ├── strength_session_items.csv
│       ├── lifestyle_schedule_rules.csv
│       ├── progression_rules.csv
│       ├── accessibility_profiles.csv
│       ├── accessibility_resources.csv
│       ├── accessibility_workout_templates.csv
│       ├── accessibility_exercise_guidance.csv
│       └── accessibility_progression_rules.csv
│
├── requirements.txt
├── .gitignore
└── README.md
```

---

# Running Locally

The project was developed using Python 3.12.

Create a virtual environment:

```powershell
python -m venv .venv
```

Install dependencies:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Run individual modules:

```powershell
.\.venv\Scripts\python.exe .\engine\nutrition_targets.py
.\.venv\Scripts\python.exe .\engine\daily_targets.py
.\.venv\Scripts\python.exe .\engine\weekly_workout_engine.py
.\.venv\Scripts\python.exe .\engine\weekly_targets.py
.\.venv\Scripts\python.exe .\engine\weekly_meal_planner.py
```

---

# Backend Integration

## Recommended responsibility split

The production frontend should **not query CSV files directly**.

Recommended flow:

```text
CSV seed data
    ↓
Supabase / PostgreSQL
    ↓
backend / engine
    ↓
generated weekly plan
    ↓
frontend
```

The CSVs are intended for database seeding, reproducibility, version control and development/testing.

## Suggested static Supabase tables

Food:

```text
foods
meals
meal_items
```

Workout/accessibility:

```text
activities
workout_templates
exercise_variations
strength_session_items
lifestyle_schedule_rules
progression_rules
accessibility_profiles
accessibility_resources
accessibility_workout_templates
accessibility_exercise_guidance
accessibility_progression_rules
```

## Suggested dynamic user tables

Exact schemas may be adapted by the backend team, but the app will likely need concepts such as:

```text
profiles
user_activity_preferences
user_accessibility_resources
user_weekly_plans
user_workout_sessions
user_workout_logs
user_exercise_logs
user_progress_state
user_meal_plans
user_meal_plan_days
user_meal_plan_items
```

---

## Example User Profile

```json
{
  "age": 22,
  "sex": "male",
  "height_cm": 175,
  "weight_kg": 70,
  "goal": "muscle_gain",
  "lifestyle_activity": "light",
  "diet": "vegetarian",
  "accessibility_id": "none"
}
```

Activity preferences can be stored separately:

```json
[
  "running",
  "cycling"
]
```

---

## Persist Progression State

The backend must persist progression state between weeks.

Conceptually:

```json
{
  "activity_rule_week": {
    "strength": 2,
    "running": 1,
    "cycling": 2
  },
  "exercise_rule_week": {
    "squat": 2,
    "lunge": 2,
    "pushup": 1,
    "bicep_curl": 2,
    "supported_row": 2
  },
  "strength_variation_levels": {
    "squat": 1,
    "lunge": 1,
    "pushup": 1,
    "bicep_curl": 1,
    "supported_row": 1
  }
}
```

Do not determine next workload using only calendar week.

---

## Workout Completion Contract

Example activity result:

```json
{
  "activity_id": "running",
  "progression_key": "running",
  "completion_pct": 76
}
```

Example strength result:

```json
{
  "activity_id": "strength",
  "progression_key": "strength",
  "completion_pct": 88,
  "exercise_completion_pct": {
    "squat": 92.5,
    "lunge": 87.5,
    "pushup": 69,
    "bicep_curl": 91,
    "supported_row": 89
  }
}
```

The backend/engine should make the progress/hold decision. The frontend should not duplicate the progression algorithm.

---

## `activity_id` vs `progression_key`

For a standard workout these may match:

```json
{
  "activity_id": "running",
  "progression_key": "running"
}
```

For an accessibility adaptation they may differ:

```json
{
  "activity_id": "walking",
  "requested_activity_id": "running",
  "progression_key": "accessible_cardio",
  "session_type": "indoor_march"
}
```

Meaning:

- `requested_activity_id` = original user preference
- `activity_id` = activity actually performed
- `progression_key` = progression sequence to update

Nutrition should use the actual activity performed. Progression should use the generated progression key.

---

# Frontend Integration

## Onboarding

Recommended important fields:

1. Age
2. Sex
3. Height
4. Weight
5. Fitness goal
6. Lifestyle
7. Preferred activities
8. Diet
9. Accessibility need
10. Accessibility resources where relevant
11. Exercise restriction/safety flag where implemented
12. Available strength equipment where implemented

## Workout Screen

The frontend should display generated data such as:

- title
- activity
- sets
- reps
- distance
- duration
- interval count
- work/recovery interval
- intensity
- equipment
- warm-up
- workout instructions
- form cues
- cooldown
- accessibility guidance

Avoid hardcoding these descriptions in the frontend when they can come from the backend/data layer.

## Meal Screen

Each generated day should contain:

```text
breakfast
lunch
evening_snack
dinner
```

Display friendly serving labels. Expanded meal details can show scaled ingredient grams, preparation note, calories, protein, carbohydrates where known, fat and fibre where known.

---

# Backend Implementation Options

## Python backend

If the main backend is Python, the engine modules can be imported directly. A small service layer can expose endpoints around weekly workout generation, workout completion, weekly nutrition targets and meal-plan generation.

FastAPI is one possible HTTP wrapper.

## Node / TypeScript backend

If the main backend uses Node/TypeScript or Supabase Edge Functions, either:

1. port the deterministic engine logic to TypeScript, or
2. keep the Python engine as a small service called by the main backend.

Avoid maintaining two different versions of the same progression rules without tests.

---

# Security

Do not commit:

- `.env`
- Supabase service-role keys
- passwords
- API keys
- JWT secrets
- private tokens

Use environment variables and an `.env.example` when configuration documentation is needed.

The raw IFCT source PDF and local raw source files are not required at runtime and are intentionally excluded from the repository.

---

# Scope and Safety

This repository is a student fitness prototype. It should not be presented as medical diagnosis, rehabilitation treatment, clinical nutrition, or individualized medical advice.

Users with medical conditions, significant pain, injuries, pregnancy-related considerations, or professional exercise restrictions may require qualified professional guidance beyond the scope of this prototype.

---

# Current Status

```text
Workout database                ✅
8-week workout progression      ✅
80% progress/hold logic         ✅
Independent strength progress   ✅
Running session variation       ✅
Accessibility data layer        ✅
Accessibility-aware workouts    ✅
Baseline nutrition targets      ✅
Daily workout-aware nutrition   ✅
Weekly nutrition targets        ✅
Food database                   ✅
Meal database                   ✅
7-day meal planner              ✅
Practical serving sizes         ✅
```

Remaining work is primarily application integration:

```text
Supabase import / schema
backend API/service integration
frontend onboarding integration
workout-screen integration
completion logging
meal-plan UI
accessibility presentation
computer-vision integration
end-to-end testing
```

---

# Suggested Integration Order

```text
1. Import static CSVs into Supabase
2. Create user/profile tables
3. Store onboarding data
4. Integrate weekly workout generation
5. Save generated workout plans
6. Connect workout completion logs
7. Persist progression state
8. Integrate weekly nutrition targets
9. Integrate meal planner
10. Display scaled ingredients/servings
11. Add accessibility presentation behavior
12. Connect computer-vision module where available
13. End-to-end test multiple user profiles
```

---

# SIH Positioning

A concise description of the project:

> **An inclusive adaptive fitness platform that personalizes workouts and nutrition according to a user's lifestyle, preferences, progress and accessibility needs.**

The differentiation comes from combining adaptive progression, workout-completion feedback, independent strength progression, workout-aware nutrition, diet-aware meal planning and accessibility-aware fitness delivery inside one connected system.

---

## License / Ownership

Add the appropriate project license or team ownership statement before public distribution if required by the team, institution, hackathon submission, or data-source terms.

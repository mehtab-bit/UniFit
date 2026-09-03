# UniFit — Universal Fitness

> **Brand Name:** UniFit  
> **Primary Tagline:** UNIVERSAL FITNESS  
> **Secondary Tagline:** FITNESS WITHOUT BARRIERS, PROGRESS WITHOUT LIMITS  
> **Mission:** Inclusive, adaptive, evidence-based fitness and nutrition for athletes of every background and ability level.
> **Initiative:** Smart India Hackathon (SIH) — Student Innovation in Fitness, Health & Sports Technology.

---

## 1. System Architecture

UniFit unites a consumer-grade mobile interface with an authoritative, evidence-based Python adaptive fitness engine and Supabase backend persistence:

```
┌─────────────────────────────────────────────────────────────────────────┐
│              UniFit Mobile Frontend (Expo SDK 52 + React Native)        │
│    - Expo Router v4 (Typed Day-Specific Navigation via date / dayId)    │
│    - Accessible Mobile UI (VoiceOver / TalkBack / High-Contrast Theme)  │
│    - Centralized Typed Services (API Layer with Resilient Mock Fallback)│
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼ HTTP / JSON (Bearer JWT Auth)
┌─────────────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend (/api/v1)                          │
│    - REST API Endpoints with Pydantic v2 Contract Validation            │
│    - In-Flight Request Deduplication & In-Memory Plan Caching           │
│    - 80% Progression Gate Evaluator & Session Completion Tracking       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                  ┌──────────────────┴──────────────────┐
                  ▼                                     ▼
┌───────────────────────────────────┐ ┌───────────────────────────────────┐
│      vijul-engine (Python)        │ │         Supabase Layer            │
│  - Authoritative Mifflin-St Jeor  │ │  - PostgreSQL Database (14 Tables)│
│  - 5 Independent Strength Families│ │  - Row Level Security (RLS)       │
│  - Activity-Specific Protocols    │ │  - Supabase Auth (JWT)            │
│  - 0.25-Step Meal Scaler (IFCT)   │ │  - Seeded with 753 Records        │
└───────────────────────────────────┘ └───────────────────────────────────┘
```

---

## 2. Actual Installed Stack & Versions

| Package / Tool | Version in `package.json` | Resolved Lockfile Version | Notes |
|---|---|---|---|
| **Expo** | `~52.0.28` | **`52.0.49`** | **Expo SDK 52** (Project is currently on SDK 52, NOT SDK 57) |
| **React Native** | `0.76.9` | **`0.76.9`** | Architecture with Fabric / Bridgeless support |
| **React** | `18.3.1` | **`18.3.1`** | Stable React 18 concurrency |
| **React DOM** | `18.3.1` | **`18.3.1`** | Web rendering support |
| **Expo Router** | `~4.0.16` | **`4.0.22`** | File-based typed routing (Expo Router v4) |
| **TypeScript** | `^5.3.3` | **`5.3.3`** | Strict mode typing (`npx tsc --noEmit` clean) |
| **Python Backend** | `>=3.10` | **`3.13.0`** | FastAPI, Uvicorn, Pydantic v2 |
| **Node.js** | `>=18` | **`v22.17.0`** | Active runtime environment |

> [!NOTE]
> **SDK 57 Notice**: The application is purposefully locked to **Expo SDK 52** (`~52.0.28`) and React Native `0.76.9`. Do not upgrade to SDK 57 without testing React 19 peer dependencies and Reanimated worklets.

---

## 3. Core Product Screens & Navigation

The frontend is structured around seven core feature screens:

1. **Home (`app/(app)/index.tsx`)**:
   - Personalized greeting with active athlete name.
   - Compact Streak Widget (flame icon, current streak count, all-time best, tappable to Streak & Plan).
   - **Today's Workout Hero**: Visual centerpiece displaying today's prescribed training, duration, secondary metric, and primary `[ Start Workout → ]` CTA.
   - **Today's Fuel**: Large circular calorie target ring (Consumed vs Remaining) with visual macro progress bars for Protein, Carbs, Fat, and Fibre.
   - **Compact Weekly Rhythm**: Horizontal Monday-to-Sunday interactive calendar (`M T W T F S S`) displaying status dots and full selected-day summaries.
   - Personal workout notes modal.

2. **Workout / Exercise Coach (`app/(app)/workout.tsx`)**:
   - Dedicated training hub with **strict activity-specific isolation**.
   - **Strength Days**: Renders the 5 prescribed movements, reps, sets, rest intervals, and live motion HUD.
   - **Running Days**: Renders the Run-Walk Protocol with distance (`2.0 km`), duration (`20 min`), intensity, and 6 cadence intervals.
   - **Cycling Days**: Renders the Cycling Protocol with distance (`8.0 km`), duration (`30 min`), and Zone 2 intensity.
   - **Walking Days**: Renders walking duration (`30 min`), cadence, and intensity.
   - **Swimming Days**: Renders swimming duration (`30 min`) and aerobic endurance metrics.
   - **Rest Days**: Renders the Active Recovery Protocol (hydration, sleep, protein goals). Suppresses the Start Workout CTA.
   - Collapsible Warm-up, Workout Instructions, Cooldown, and Accessibility Guidance blocks.

3. **Streak & Plan (`app/(app)/streak-plan.tsx`)**:
   - Monthly consistency ring (e.g. `83% Monthly Consistency`).
   - Interactive monthly fitness calendar with multi-state visual indicators: `completed`, `missed`, `rest`, `planned`, and `today`.
   - Today, Tomorrow, and Upcoming session breakdown cards.
   - Direct date routing to launch any selected workout session.

4. **Food & Nutrition (`app/(app)/food.tsx`)**:
   - Daily calorie and macronutrient progress visualization.
   - Chronological meal timeline (Breakfast, Lunch, Dinner, Snacks).
   - Collapsible recipe cards with 0.25-serving step scaling, ingredient lists, and preparation directions.

5. **Activity Tracking (`app/(app)/activity.tsx`)**:
   - Movement tracking showing total active minutes against weekly targets.
   - Discipline breakdowns (Walking, Running, Cycling, Swimming, Strength).

6. **Progress (`app/(app)/progress.tsx`)**:
   - Monthly consistency overview and cumulative active minutes.
   - 4-stage progression timeline: `Calibration` → `Foundation` → `Build` → `Progress`.
   - Engine progression decisions and exercise family milestones.

7. **Profile & Settings (`app/(app)/profile.tsx`)**:
   - Athlete baseline (Age, Height, Weight, Biological Sex).
   - Goal profile (e.g. Muscle Gain, Fat Loss, Maintenance) and Dietary Preference.
   - Accessibility settings: Text-to-Speech speed rate slider, voice announcement toggles, high-contrast indicators.

8. **Authentication & Demo Mode (`app/(auth)/login.tsx`)**:
   - Standard Supabase email and password login / sign-up.
   - **One-Tap Demo Mode**: "Continue with Demo Account" button (`demo@unifit.app` / `UniFitDemo@123`) for presentation and offline review without typing credentials.

---

## 4. Workout Activity Engine & Strict Data Isolation

### Strict Activity Isolation (Zero Data Leakage)
Workouts render strictly according to their domain activity type. Strength exercises are **never** attached or rendered on non-strength days:

| Activity | Engine Prescribed Structure | UI Presentation | Exercise List Displayed? |
|---|---|---|:---:|
| **Strength** | 5 movements, sets, reps, rest sec | Sets, reps, rest, active form HUD | **YES (5 movements)** |
| **Running** | Distance (km), duration, intervals | 2.0 km, 20 min, 6 intervals (60s run / 90s walk) | **NO (0 exercises)** |
| **Cycling** | Distance (km), duration, intensity | 8.0 km, 30 min, Zone 2 steady cadence | **NO (0 exercises)** |
| **Walking** | Duration (min), distance, intensity | 30 min, brisk pace, aerobic conditioning | **NO (0 exercises)** |
| **Swimming** | Duration (min), distance, aerobic | 30 min, continuous laps, low-impact cardio | **NO (0 exercises)** |
| **Rest** | Recovery targets (hydration, sleep) | Active Recovery Protocol (2.5L water, 8h sleep) | **NO (0 exercises)** |

### Supported Strength Exercise Families
The authoritative fitness engine supports five distinct exercise families, each progressing independently:
1. **Squat Family**: Chair Squat → Bodyweight Squat → Goblet Squat.
2. **Lunge Family**: Supported Reverse Lunge → Bodyweight Lunge → Walking Lunge.
3. **Push-up Family**: Wall Push-Up → Incline Push-Up → Standard Floor Push-Up.
4. **Row / Pull Family**: Light Supported One-Arm Row → Dumbbell Row → Incline Row.
5. **Bicep Curl Family**: Light Bottle Bicep Curl → Dumbbell Bicep Curl → Hammer Curl.

### Day-Specific Route Navigation
Workouts are selected and opened using explicit date and day parameters:
```typescript
router.push({
  pathname: '/(app)/workout',
  params: { date: target.date, dayId: target.id },
});
```
[`app/(app)/workout.tsx`](file:///C:/Users/DEEPANSHU%20KASHYAP/.gemini/antigravity/scratch/unifit-app/app/%28app%29/workout.tsx) receives these parameters via `useLocalSearchParams<{ date?: string; dayId?: string }>()` and resolves the specific day's workout from the cached plan, preventing Monday's strength session from leaking into Tuesday's run or Saturday's ride.

---

## 5. 8-Week Progression Model & 80% Gate

### 8-Week Macrocycle Structure
The engine employs an 8-week progressive overload architecture designed to balance adaptation and recovery:
```
Week 1  → Starting baseline workload (Calibration)
Week 2  → Progressive overload
Week 3  → Progressive overload
Week 4  → Deload / Consolidation week (reduced volume to consolidate adaptation)
Week 5  → Progressive overload resumes
Week 6  → Progressive overload
Week 7  → Peak progression
Week 8  → Assessment & cycle completion
```

### 80% Progression / Hold Gate
When a workout session is completed and logged via `POST /api/v1/workout/complete`, the backend evaluates the athlete's completion percentage:
```
overall weekly completion >= 80%
AND
that activity's completion >= 80%
→ ADVANCE to next progression level

otherwise
→ HOLD current progression level for further movement mastery
```

### Independent Strength Progression
Each of the 5 strength families is evaluated independently:
```
Squat          92.5%  → ADVANCE
Lunge          87.5%  → ADVANCE
Push-up        69.0%  → HOLD
Bicep Curl     91.0%  → ADVANCE
Supported Row  89.0%  → ADVANCE
```
This ensures a plateau in one movement (e.g. push-ups) does not hold back progress in other functional movements.

### Calendar Week vs Progression Rule Week
Calendar week and rule progression week are decoupled:
* An athlete in **Calendar Week 4** may be on **Rule Week 2** for running if running sessions were held, while on **Rule Week 4** for strength.
* The state is persisted between sessions via:
  - `activity_rule_week`: current level per discipline
  - `exercise_rule_week`: current level per strength family
  - `strength_variation_levels`: active variation index (1, 2, or 3)

### Semantic Activity Mapping
* `requested_activity_id`: Original user preference (e.g. `running`).
* `activity_id`: Activity actually executed (e.g. `walking` or `indoor_march` under accessibility adaptation).
* `progression_key`: Sequence tracking rule (e.g. `accessible_cardio`).

---

## 6. Nutrition Engine & Meal Planning

* **Energy Expenditure Formulas**: Strict Mifflin-St Jeor equation calculation adjusted for biological sex, age, height, weight, and lifestyle activity factor:
  - Sedentary: $\text{BMR} \times 1.2$
  - Light: $\text{BMR} \times 1.375$
  - Moderate: $\text{BMR} \times 1.55$
  - Very Active: $\text{BMR} \times 1.725$
* **Workout-Aware Calorie Targets**: Planned workout energy expenditure is dynamically added to daily maintenance:
  $$\text{Daily Target} = \text{Baseline Maintenance} + \text{Workout Energy} + \text{Goal Adjustment}$$
* **Protein Rule**:
  - Minimum: $1.50\text{ g/kg/day}$
  - Target: $1.625\text{ g/kg/day}$
  - Maximum: $1.75\text{ g/kg/day}$
* **Dietary Regimens**: Comprehensive support for **Vegetarian**, **Vegan**, **Eggetarian**, and **Non-Vegetarian** meal catalogs.
* **0.25-Step Practical Serving Scaling**: Meals scale in practical increments ($0.75\times$, $1.0\times$, $1.25\times$, $1.5\times$, $1.75\times$, $2.0\times$) using Indian Food Composition Tables (IFCT 2017) nutritional values.
* **Missing IFCT Data Preservation**: Unreported carbohydrate or fibre values in source foods are preserved as SQL `NULL` / status flags (`carbohydrate_status`, `fiber_status`) rather than falsely coerced to 0.

---

## 7. Universal Accessibility Design

UniFit was engineered from inception around Universal Design principles:

* **Screen Reader Compliance**: Complete iOS VoiceOver and Android TalkBack support with descriptive `accessibilityLabel`, `accessibilityHint`, `accessibilityRole`, and `accessibilityState` across all interactive controls.
* **Semantic Hierarchy**: Screen titles and major sections use `accessibilityRole="header"`.
* **Dynamic Live Regions**: Rep counters, guidance cues, and status alerts use `accessibilityLiveRegion="polite"` or `"assertive"`.
* **Touch Targets**: All buttons, pills, toggles, and list items exceed Android (48×48 dp) and iOS (44×44 pt) guidelines.
* **Text-to-Speech Engine**: Adjustable speech rate slider in Profile settings connected to `utils/speech.ts` for audible workout cues.
* **Haptic Tactile Feedback**: Haptic pulses via `utils/haptics.ts` signal rep increments, rest expirations, and form corrections.
* **Resource-Aware Adaptation**:
  - Blind / low-vision with guide → `Guided Run`
  - Blind / low-vision with stationary bike → `Stationary Cycling`
  - Accessible pool support → `Supported Accessible Swim`
  - Safe indoor space without equipment → `Indoor March` / `Supported Step-Touch Cardio`
* **High-Contrast Palette**:
  - Deep Navy Hero Surface: `#001554`
  - Accent / Metric Highlight: `#00C8FF`
  - Primary Brand Blue: `#2563EB`
  - Deep Navy Text: `#040E34` / `#111827`
  - Crisp White Surface: `#FFFFFF`
  - Light Background: `#F8FAFC`

---

## 8. Terminology & Brand Standards

> [!IMPORTANT]
> **Zero User-Facing "AI" Terminology**: UniFit does not use buzzwords like "AI Coach", "AI Workout", "AI-Powered", or "Artificial Intelligence" in the client interface.  
> The app uses authoritative, human-centered terminology:
> - **Exercise Coach**
> - **Live Exercise Feedback**
> - **Form Feedback**
> - **Guided Workout**
> - **Personalized Plan**

---

## 9. Backend API Endpoints Reference (`/api/v1`)

The FastAPI server exposes RESTful endpoints at `/api/v1`:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Service health status, engine status, and database connectivity |
| `POST` | `/api/v1/profile/preview` | Preview BMR, TDEE, and recommended weekly active days |
| `POST` | `/api/v1/fitness/weekly-plan` | **Combined endpoint**: Returns full 7-day workouts, daily nutrition targets, and portion-scaled meals |
| `POST` | `/api/v1/workout/weekly` | Generate 7-day adaptive workout schedule |
| `GET` | `/api/v1/workout/{date}` | Retrieve single-day workout session by date or day index |
| `POST` | `/api/v1/workout/complete` | Log workout completion; backend evaluates 80% progression gates |
| `POST` | `/api/v1/nutrition/weekly` | Generate 7-day daily macronutrient targets |
| `GET` | `/api/v1/nutrition/{date}` | Retrieve single-day nutrition target |
| `POST` | `/api/v1/meals/weekly` | Generate 7-day portion-scaled meal plan |
| `GET` | `/api/v1/meals/{date}` | Retrieve single-day meals breakdown |
| `GET` | `/api/v1/progress` | Retrieve user weekly progress rules, decisions, and consistency |
| `GET` | `/api/v1/streak` | Retrieve current streak, best streak, and calendar adherence |

---

## 10. Frontend API Layer, Caching & Mock Fallbacks

* **Typed API Client (`services/api/apiClient.ts`)**: Centralized HTTP client configured with base URL, 12-second timeout, Supabase auth bearer token propagation, and normalized error responses.
* **In-Memory Plan Caching**: [`services/api/workoutApi.ts`](file:///C:/Users/DEEPANSHU%20KASHYAP/.gemini/antigravity/scratch/unifit-app/services/api/workoutApi.ts) caches the weekly plan in client memory. Subsequent day selections (Monday, Tuesday, Saturday, Streak & Plan) resolve in **$< 1$ ms with 0 redundant network calls**.
* **In-Flight Request Deduplication**: Parallel component mount requests are coalesced into a single network promise, eliminating duplicate backend traffic.
* **Resilient Mock Fallback (`services/mock/`)**: If the FastAPI backend is offline or unreachable, the frontend automatically falls back to engine-aligned Week 1 mock data, ensuring uninterrupted testing and presentations.

---

## 11. Database Schema & Seeding

* **PostgreSQL Schema (`supabase/full_schema.sql`)**: Defines 14 normalized tables:
  - `profiles`, `user_activity_preferences`, `user_accessibility_resources`
  - `user_weekly_plans`, `workout_logs`, `progression_states`
  - `foods`, `meals`, `meal_items`, `activities`, `workout_templates`
  - `exercise_variations`, `strength_session_items`, `accessibility_profiles`
* **Automated CSV Seeder (`backend/scripts/seed_csv_to_supabase.py`)**: Parses 14 nutritional and workout CSV datasets from `data/`, properly handles missing IFCT data as SQL `NULL`, and generates `supabase/seed.sql` with 753 records.

---

## 12. Local Development & Setup Instructions

### Prerequisites
* **Node.js**: `v18+` (Tested on `v22.17.0`)
* **Python**: `3.10+` (Tested on `3.13.0`)
* **Git**

### Step 1: Environment Configuration
Copy the template to create your local `.env`:
```bash
cp .env.example .env
```
Fill in the configuration variables in `.env`:
```env
# Frontend Client Configuration (Client-Safe)
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_DEMO_MODE=true

# Backend Server Configuration (Secret - Never expose to client)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-secret-key
```

> [!WARNING]
> **Testing on Physical Phones via Expo Go**:  
> `localhost` or `127.0.0.1` on a physical phone refers to the phone itself.  
> To test on a physical mobile device over Wi-Fi, change `EXPO_PUBLIC_API_URL` to your computer's local network IP:
> ```env
> EXPO_PUBLIC_API_URL=http://192.168.1.15:8000
> ```

### Step 2: Start the FastAPI Backend
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Start the Uvicorn development server from the repository root
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive API docs are available at:
* Swagger UI: `http://localhost:8000/docs`
* ReDoc: `http://localhost:8000/redoc`
* Health Check: `http://localhost:8000/api/v1/health`

### Step 3: Start the Expo Frontend
In a separate terminal window:
```bash
# Install dependencies
npm install

# Start the Expo bundler
npx expo start

# Or run directly on Web:
npm run web

# Or run on Android Emulator / iOS Simulator:
npm run android
npm run ios
```

---

## 13. Security & Secrets Management

> [!CAUTION]
> **Never commit `.env` or sensitive credentials to version control.**  
> - `.env` and all `.env.*` files (except `.env.example`) are strictly ignored in `.gitignore`.
> - `SUPABASE_SERVICE_ROLE_KEY` has full administrative access bypassing Row Level Security and must only exist on the backend server.
> - Client code must only access variables prefixed with `EXPO_PUBLIC_`.
> - The repository was audited: **Zero hardcoded secrets, API keys, or JWT tokens are tracked in git.**

---

## 14. Verification & Validation Commands

All core validation checks pass cleanly:

```bash
# 1. Frontend TypeScript Compilation
npx tsc --noEmit
# Result: Exit code 0 (0 errors)

# 2. Expo Web Production Bundle Export
npx expo export -p web
# Result: Bundled 1,067 modules cleanly into dist/

# 3. Expo Project Dependency Check
npx expo-doctor
# Result: 17/18 checks passed (SDK 52 compatibility verified)

# 4. Backend Engine Test Suite
python -m pytest backend/tests/test_engine_api.py -v
# Result: 12/12 integration tests passed (100% contract compliance)
```

---

## 15. Scope and Safety

UniFit is an adaptive fitness and wellness application. It is not intended as medical diagnosis, clinical rehabilitation, medical nutritional therapy, or individual medical advice. Users with severe cardiovascular conditions, acute injuries, pregnancy-related complications, or clinical exercise restrictions should consult a qualified physician or healthcare provider.

---

## 16. Repository Directory Structure

```
unifit-app/
├── .env.example                     # Environment template with security boundaries
├── .gitignore                       # Git ignore protecting .env.*, build, & cache files
├── app.json                         # Expo application configuration & splash metadata
├── package.json                     # Frontend dependencies (Expo SDK 52, React Native 0.76)
├── tsconfig.json                    # TypeScript strict mode configuration
├── requirements.txt                 # Authoritative Python engine dependencies
├── README.md                        # Master unified repository documentation
│
├── app/                             # Expo Router file-based route hierarchy
│   ├── _layout.tsx                  # Root authentication guard & font loading
│   ├── (auth)/                      # Authentication routes (login, forgot-password)
│   └── (app)/                       # Authenticated routes
│       ├── _layout.tsx              # Bottom tab bar layout & icon registry
│       ├── index.tsx                # Home screen (Workout Hero, Nutrition, Weekly Rhythm)
│       ├── workout.tsx              # Exercise Coach & activity-isolated training HUD
│       ├── streak-plan.tsx          # Streak records, monthly calendar, & upcoming plan
│       ├── food.tsx                 # Nutrition targets & 0.25-step scaled meal cards
│       ├── activity.tsx             # Multi-discipline active minutes tracking
│       ├── progress.tsx             # Milestone progression journey & consistency
│       └── profile.tsx              # User baseline, accessibility speeds, & settings
│
├── backend/                         # FastAPI application & engine service layer
│   ├── main.py                      # FastAPI app entry point, CORS, & route registry
│   ├── requirements.txt             # Python dependencies (fastapi, uvicorn, pydantic)
│   ├── README.md                    # Backend-specific architecture & test documentation
│   ├── routes/                      # Route handlers (/api/v1/fitness, workout, etc.)
│   ├── schemas/                     # Pydantic v2 validation models
│   ├── services/                    # Engine wrapper, progression gates, Supabase client
│   ├── scripts/                     # seed_csv_to_supabase.py database seeder
│   └── tests/                       # test_engine_api.py (12 contract integration tests)
│
├── data/                            # Processed IFCT food data and workout CSV templates
│   ├── processed/                   # Curated 100 foods, meals, meal_items
│   └── workouts/                    # Activities, templates, variations, accessibility rules
│
├── engine/                          # Authoritative Python Inclusive Adaptive Fitness Engine
│   ├── nutrition_targets.py         # Mifflin-St Jeor & macro calculator
│   ├── daily_targets.py             # Day-specific workout-aware energy adjustments
│   ├── weekly_targets.py            # Weekly adherence and macro rollups
│   ├── weekly_workout_engine.py     # 8-week progressive schedule & template assembler
│   └── weekly_meal_planner.py       # 0.25-step practical portion meal planner
│
├── components/                      # Modular reusable UI components
│   ├── animations/                  # Reanimated micro-interactions (rings, buttons, reps)
│   ├── common/                      # Primary buttons, text inputs, headers, loaders
│   ├── food/                        # Meal cards, macro pills, recipe collapsibles
│   ├── home/                        # Today's workout hero, fuel snapshot, weekly rhythm
│   ├── streak/                      # Monthly calendar grid, stats, upcoming rows
│   └── workout/                     # Workout header, exercise list, guidance collapsibles
│
├── constants/                       # Theme colors (#001554, #00C8FF), layout, typography
├── context/                         # AuthContext (Supabase + Demo) & AccessibilityContext
├── hooks/                           # Accessibility announcements & interaction hooks
├── lib/                             # Supabase client initializer & profile helpers
├── services/                        # Service registry, API client, & mock fallbacks
├── supabase/                        # full_schema.sql (14 tables) & seed.sql (753 records)
├── types/                           # TypeScript domain models, streak types, & navigation
└── utils/                           # Text-to-speech audio engine & haptic feedback drivers
```
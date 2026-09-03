# UniFit FastAPI Backend & Python Fitness Engine Integration

This backend bridges the UniFit React Native / Expo mobile frontend with the authoritative Python Inclusive Adaptive Fitness Engine (`vijul-engine`).

---

## 1. Architecture

```
                      UniFit Expo Frontend (React Native + TypeScript)
                                           │
                                           ▼ HTTP / JSON (Bearer JWT)
                          FastAPI Backend (/api/v1)
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
       Python Service Layer                        Supabase Persistence Layer
  (backend/services/engine_service.py)           (PostgreSQL / Auth / Tables)
                    │                                             │
                    ▼                                             ▼
        vijul-engine Core Modules                  Dynamic Logs & Static CSVs
  - nutrition_targets.py                          - profiles & weekly_plans
  - daily_targets.py                              - workout_logs & progression
  - weekly_targets.py                             - foods, meals, templates
  - weekly_workout_engine.py
  - weekly_meal_planner.py
```

- **Engine-Owned Business Logic**: The Python engine strictly owns all calorie formulas (Mifflin-St Jeor), workout progression (80% progression gates), independent strength family progression, accessibility fallback routing, and 0.25-serving portion optimization.
- **Frontend-Ready Contract**: The API provides versioned endpoints matching the exact schema expected by the frontend without leaking internal engine complexities.

---

## 2. Directory Structure

```
unifit-app/
├── backend/
│   ├── main.py                         # FastAPI app entry point & middleware
│   ├── requirements.txt                # Backend dependencies
│   ├── schemas/                        # Pydantic request & response schemas
│   │   ├── profile.py
│   │   ├── workout.py
│   │   ├── nutrition.py
│   │   ├── meal.py
│   │   ├── completion.py
│   │   └── progress.py
│   ├── routes/                         # API Route handlers (/api/v1)
│   │   ├── health.py
│   │   ├── profile.py
│   │   ├── fitness.py                  # Preferred combined full-week plan
│   │   ├── workout.py
│   │   ├── nutrition.py
│   │   ├── meals.py
│   │   ├── completion.py
│   │   └── progress.py
│   ├── services/                       # Thin service wrappers
│   │   ├── engine_service.py           # vijul-engine orchestration
│   │   ├── progression_service.py      # 80% gate evaluation & state tracking
│   │   └── supabase_service.py         # DB persistence & plan caching
│   ├── scripts/
│   │   └── seed_csv_to_supabase.py     # CSV -> SQL/Supabase seeder
│   └── tests/
│       └── test_engine_api.py          # 12 comprehensive integration tests
└── supabase/
    ├── full_schema.sql                 # Comprehensive PostgreSQL schema
    └── seed.sql                        # 753 records across 14 tables
```

---

## 3. Environment Setup

Create `.env` inside `unifit-app/`:

```bash
# Backend Configuration
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006,http://localhost:3000
VIJUL_ENGINE_PATH=../vijul-engine

# Supabase (Optional for local offline development)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Frontend API Base URL
EXPO_PUBLIC_API_URL=http://localhost:8000
```

---

## 4. Local Execution Commands

### A. Start the Backend API Server
```bash
# From unifit-app root:
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### B. Start the Expo Frontend
```bash
# In a separate terminal inside unifit-app:
npx expo start
```

---

## 5. API Endpoints Reference (`/api/v1`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Service health status and database connectivity |
| `POST` | `/api/v1/profile/preview` | Preview BMR, baseline energy, and target active days |
| `POST` | `/api/v1/fitness/weekly-plan` | **Preferred combined endpoint**: returns workouts, daily nutrition, and portion-scaled meals |
| `POST` | `/api/v1/workout/weekly` | Generate 7-day adaptive workout schedule |
| `GET` | `/api/v1/workout/{date}` | Retrieve single day workout session |
| `POST` | `/api/v1/workout/complete` | Log workout completion; backend evaluates 80% progression gates |
| `POST` | `/api/v1/nutrition/weekly` | Generate 7-day daily nutrition targets |
| `GET` | `/api/v1/nutrition/{date}` | Retrieve single day nutrition target |
| `POST` | `/api/v1/meals/weekly` | Generate 7-day portion-scaled meal plan |
| `GET` | `/api/v1/meals/{date}` | Retrieve single day meals |
| `GET` | `/api/v1/progress` | Retrieve user rule week states and consistency metrics |
| `GET` | `/api/v1/streak` | Retrieve current/best streak and weekly adherence |

---

## 6. Database & Seeding

### Running the Seed Script
To generate or update `supabase/seed.sql`:
```bash
python backend/scripts/seed_csv_to_supabase.py
```
This reads all 14 CSV files from `vijul-engine/data/`, properly handles missing IFCT data as `NULL` (rather than coercing to 0), and creates `supabase/seed.sql` with 753 records.

---

## 7. Running Backend Tests

Run the full integration test suite:
```bash
python -m pytest backend/tests/test_engine_api.py -v
```
Verifies all 12 core contracts:
1. Standard vegetarian user plan
2. Muscle gain user plan
3. Running + cycling preferences
4. Blind/low-vision with safe indoor space
5. Blind/low-vision with guide & stationary bike
6. Deaf/hard-of-hearing accessibility presentation
7. Strength completion below 80% threshold (hold)
8. Strength completion above 80% threshold (advance)
9. Independent strength exercise family progression
10. Preservation of missing carbohydrate/fibre values
11. Meal plan 0.25-serving step portion scaling
12. Activity ID vs progression key distinction

"""
Comprehensive Test Suite for UniFit FastAPI Engine Integration.

Verifies the 12 core engine contracts specified in the requirements.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.engine_service import engine_service
from backend.services.progression_service import progression_service

client = TestClient(app)


# ----------------------------------------------------------------------
# 1. Standard Vegetarian User Plan
# ----------------------------------------------------------------------
def test_standard_vegetarian_user():
    payload = {
        "user_id": "test_veg_user",
        "week_number": 1,
        "profile": {
            "age": 25,
            "sex": "male",
            "height_cm": 175.0,
            "weight_kg": 70.0,
            "goal": "maintain",
            "lifestyle_activity": "light",
            "diet": "vegetarian",
            "accessibility_id": "none",
        },
        "activity_preferences": ["running", "cycling"],
        "accessibility_resources": [],
    }

    response = client.post("/api/v1/fitness/weekly-plan", json=payload)
    assert response.status_code == 200, response.text

    data = response.json()
    assert data["week_number"] == 1
    assert len(data["workouts"]) == 7
    assert len(data["nutrition"]) == 7
    assert len(data["meals"]) == 7

    # Stable protein target across all 7 days: 70 kg * 1.625 = 113.8g
    for day in data["nutrition"]:
        assert abs(day["nutrition"]["protein_target_g"] - 113.8) < 0.2


# ----------------------------------------------------------------------
# 2. Muscle Gain User with Caloric Surplus
# ----------------------------------------------------------------------
def test_muscle_gain_user():
    payload = {
        "user_id": "test_muscle_user",
        "week_number": 1,
        "profile": {
            "age": 28,
            "sex": "male",
            "height_cm": 180.0,
            "weight_kg": 80.0,
            "goal": "muscle_gain",
            "lifestyle_activity": "moderate",
            "diet": "non_vegetarian",
            "accessibility_id": "none",
        },
        "activity_preferences": ["running", "swimming"],
        "accessibility_resources": [],
    }

    response = client.post("/api/v1/fitness/weekly-plan", json=payload)
    assert response.status_code == 200, response.text

    data = response.json()
    first_day_nutrition = data["nutrition"][0]["nutrition"]

    # Goal adjustment for muscle gain should be +10%
    assert first_day_nutrition["goal_adjustment_percent"] == 10.0
    # Protein target: 80 * 1.625 = 130.0g
    assert abs(first_day_nutrition["protein_target_g"] - 130.0) < 0.2


# ----------------------------------------------------------------------
# 3. Running + Cycling Preferences Schedule
# ----------------------------------------------------------------------
def test_running_cycling_preferences():
    payload = {
        "user_id": "test_prefs_user",
        "week_number": 1,
        "profile": {
            "age": 30,
            "sex": "female",
            "height_cm": 165.0,
            "weight_kg": 60.0,
            "goal": "maintain",
            "lifestyle_activity": "light",
            "diet": "vegan",
            "accessibility_id": "none",
        },
        "activity_preferences": ["running", "cycling"],
    }

    response = client.post("/api/v1/workout/weekly", json=payload)
    assert response.status_code == 200, response.text

    data = response.json()
    active_workouts = [
        d["workout"] for d in data["days"] if not d["is_rest_day"] and d["workout"]
    ]

    activities = [w["activity_id"] for w in active_workouts]
    assert "strength" in activities
    assert "running" in activities
    assert "cycling" in activities


# ----------------------------------------------------------------------
# 4. Blind/Low-Vision with Safe Indoor Space Fallback
# ----------------------------------------------------------------------
def test_blind_low_vision_safe_indoor_space():
    payload = {
        "user_id": "test_blind_home",
        "week_number": 1,
        "profile": {
            "age": 35,
            "sex": "male",
            "height_cm": 170.0,
            "weight_kg": 68.0,
            "goal": "maintain",
            "lifestyle_activity": "light",
            "diet": "vegetarian",
            "accessibility_id": "blind_low_vision",
        },
        "activity_preferences": ["running", "cycling"],
        "accessibility_resources": ["safe_indoor_space", "stable_support"],
    }

    response = client.post("/api/v1/workout/weekly", json=payload)
    assert response.status_code == 200, response.text

    data = response.json()
    active_workouts = [
        d["workout"] for d in data["days"] if not d["is_rest_day"] and d["workout"]
    ]

    progression_keys = [w["progression_key"] for w in active_workouts]
    assert "accessible_cardio" in progression_keys

    # Check fallback fields
    cardio_sessions = [w for w in active_workouts if w["progression_key"] == "accessible_cardio"]
    assert len(cardio_sessions) > 0
    assert cardio_sessions[0]["accessibility_adapted"] is True


# ----------------------------------------------------------------------
# 5. Blind/Low-Vision with Guide & Stationary Bike
# ----------------------------------------------------------------------
def test_blind_low_vision_with_guide():
    payload = {
        "user_id": "test_blind_guided",
        "week_number": 1,
        "profile": {
            "age": 35,
            "sex": "male",
            "height_cm": 170.0,
            "weight_kg": 68.0,
            "goal": "maintain",
            "lifestyle_activity": "light",
            "diet": "vegetarian",
            "accessibility_id": "blind_low_vision",
        },
        "activity_preferences": ["running", "cycling"],
        "accessibility_resources": ["stable_support", "guide", "stationary_bike"],
    }

    response = client.post("/api/v1/workout/weekly", json=payload)
    assert response.status_code == 200, response.text

    data = response.json()
    active_workouts = [
        d["workout"] for d in data["days"] if not d["is_rest_day"] and d["workout"]
    ]

    activities = [w["activity_id"] for w in active_workouts]
    assert "running" in activities
    assert "cycling" in activities


# ----------------------------------------------------------------------
# 6. Deaf / Hard-of-Hearing Accessibility Presentation
# ----------------------------------------------------------------------
def test_deaf_hard_of_hearing_user():
    payload = {
        "user_id": "test_deaf_user",
        "week_number": 1,
        "profile": {
            "age": 26,
            "sex": "female",
            "height_cm": 162.0,
            "weight_kg": 55.0,
            "goal": "maintain",
            "lifestyle_activity": "light",
            "diet": "vegetarian",
            "accessibility_id": "deaf_hard_of_hearing",
        },
        "activity_preferences": ["running", "cycling"],
    }

    response = client.post("/api/v1/workout/weekly", json=payload)
    assert response.status_code == 200, response.text

    data = response.json()
    assert data["accessibility_id"] == "deaf_hard_of_hearing"


# ----------------------------------------------------------------------
# 7. Strength Completion Below Threshold (70% < 80% Gate)
# ----------------------------------------------------------------------
def test_strength_completion_below_threshold():
    payload = {
        "user_id": "user_below_threshold",
        "activity_id": "strength",
        "progression_key": "strength",
        "completion_pct": 70.0,
        "exercise_completion_pct": {
            "squat": 70.0,
            "lunge": 70.0,
            "pushup": 70.0,
            "bicep_curl": 70.0,
            "supported_row": 70.0,
        },
    }

    response = client.post("/api/v1/workout/complete", json=payload)
    assert response.status_code == 200, response.text

    data = response.json()
    assert data["activity_can_progress"] is False


# ----------------------------------------------------------------------
# 8. Strength Completion Above Threshold (90% >= 80% Gate)
# ----------------------------------------------------------------------
def test_strength_completion_above_threshold():
    payload = {
        "user_id": "user_above_threshold",
        "activity_id": "strength",
        "progression_key": "strength",
        "completion_pct": 90.0,
        "exercise_completion_pct": {
            "squat": 92.0,
            "lunge": 88.0,
            "pushup": 85.0,
            "bicep_curl": 90.0,
            "supported_row": 89.0,
        },
    }

    response = client.post("/api/v1/workout/complete", json=payload)
    assert response.status_code == 200, response.text

    data = response.json()
    assert data["activity_can_progress"] is True


# ----------------------------------------------------------------------
# 9. Independent Exercise Progression
# ----------------------------------------------------------------------
def test_independent_exercise_progression():
    payload = {
        "user_id": "user_independent_prog",
        "activity_id": "strength",
        "progression_key": "strength",
        "completion_pct": 85.0,
        "exercise_completion_pct": {
            "squat": 95.0,
            "lunge": 88.0,
            "pushup": 60.0,  # Below threshold
            "bicep_curl": 90.0,
            "supported_row": 89.0,
        },
    }

    response = client.post("/api/v1/workout/complete", json=payload)
    assert response.status_code == 200, response.text

    data = response.json()
    advances = data["exercise_advances"]
    assert advances["squat"] is True
    assert advances["lunge"] is True
    assert advances["pushup"] is False  # Held back due to 60% completion


# ----------------------------------------------------------------------
# 10. Missing Nutrition Values Preservation (NULL vs 0)
# ----------------------------------------------------------------------
def test_missing_nutrition_values():
    from engine.weekly_meal_planner import MealDatabase

    database = MealDatabase()
    incomplete_fiber_meals = [
        m for m in database.meals if str(m.get("fiber_complete")).strip().lower() in ("false", "0")
    ]
    assert len(incomplete_fiber_meals) > 0


# ----------------------------------------------------------------------
# 11. Meal Plan Portion Scaling (0.25-Step Steps)
# ----------------------------------------------------------------------
def test_meal_plan_portion_scaling():
    payload = {
        "user_id": "test_portion_user",
        "week_number": 1,
        "profile": {
            "age": 25,
            "sex": "male",
            "height_cm": 175.0,
            "weight_kg": 70.0,
            "goal": "maintain",
            "lifestyle_activity": "light",
            "diet": "vegetarian",
            "accessibility_id": "none",
        },
        "activity_preferences": ["running", "cycling"],
    }

    response = client.post("/api/v1/meals/weekly", json=payload)
    assert response.status_code == 200, response.text

    data = response.json()
    for day in data["days"]:
        for meal in day["meals"]:
            multiplier = meal["portion_multiplier"]
            # Check multiplier is a multiple of 0.25 (e.g. 1.0, 1.25, 1.5, 1.75, 2.0)
            remainder = round((multiplier * 100) % 25, 4)
            assert remainder == 0 or remainder == 25, f"Invalid portion multiplier: {multiplier}"


# ----------------------------------------------------------------------
# 12. Activity ID vs Progression Key Distinction
# ----------------------------------------------------------------------
def test_activity_vs_progression_key_distinction():
    payload = {
        "user_id": "test_distinction_user",
        "week_number": 1,
        "profile": {
            "age": 32,
            "sex": "male",
            "height_cm": 172.0,
            "weight_kg": 72.0,
            "goal": "maintain",
            "lifestyle_activity": "light",
            "diet": "vegetarian",
            "accessibility_id": "blind_low_vision",
        },
        "activity_preferences": ["running"],
        "accessibility_resources": ["safe_indoor_space", "stable_support"],
    }

    response = client.post("/api/v1/workout/weekly", json=payload)
    assert response.status_code == 200, response.text

    data = response.json()
    cardio_days = [
        d["workout"]
        for d in data["days"]
        if not d["is_rest_day"] and d["workout"] and d["workout"]["activity_id"] == "walking"
    ]

    assert len(cardio_days) > 0
    fallback_session = cardio_days[0]

    # Distinct concepts
    assert fallback_session["activity_id"] == "walking"
    assert fallback_session["requested_activity_id"] == "running"
    assert fallback_session["progression_key"] == "accessible_cardio"
    assert fallback_session["session_type"] == "indoor_march"

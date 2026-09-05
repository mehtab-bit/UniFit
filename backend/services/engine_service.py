"""
UniFit Engine Service Wrapper.

Orchestrates the existing vijul-engine modules without re-implementing
any progression formulas, nutrition calculations, or meal planning logic.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any, Optional

# Resolve path to vijul-engine
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent.parent  # unifit-app
VIJUL_ENGINE_DIR = Path(
    os.getenv("VIJUL_ENGINE_PATH", str(PROJECT_ROOT))
).resolve()

if not VIJUL_ENGINE_DIR.exists():
    raise RuntimeError(f"vijul-engine directory not found at: {VIJUL_ENGINE_DIR}")

# Add vijul-engine to sys.path if not present
if str(VIJUL_ENGINE_DIR) not in sys.path:
    sys.path.insert(0, str(VIJUL_ENGINE_DIR))

# Import the existing Python engine modules
from engine.nutrition_targets import (
    UserProfile as EngineUserProfile,
    BaselineNutritionTargets,
    calculate_baseline_targets,
    calculate_bmr,
    calculate_baseline_maintenance,
    calculate_protein_targets,
)
from engine.daily_targets import (
    DailyWorkout as EngineDailyWorkout,
    DailyNutritionTargets,
    calculate_daily_targets,
    calculate_net_workout_kcal,
    daily_workout_from_plan_day,
)
from engine.weekly_targets import (
    WeeklyNutritionPlan,
    calculate_weekly_nutrition_targets,
    generate_combined_week,
)
from engine.weekly_workout_engine import (
    ProgressState as EngineProgressState,
    WorkoutDatabase,
    generate_weekly_workout_plan,
    summarize_week_completion,
    activity_can_progress,
    determine_rule_week,
    determine_strength_exercise_rule_week,
    STRENGTH_FAMILIES,
    PROGRESSION_THRESHOLD,
)
from engine.weekly_meal_planner import (
    MealDatabase,
    WeeklyMealPlan,
    generate_weekly_meal_plan,
    generate_full_fitness_week,
)

ENGINE_VERSION = "1.0.0"
RULE_DATA_VERSION = "workout-rules-2026-09-05"

# Patch data paths in imported engine modules so they work regardless of current working directory
import engine.weekly_workout_engine as _wwe
import engine.weekly_meal_planner as _wmp

WORKOUTS_DIR = VIJUL_ENGINE_DIR / "data" / "workouts"
PROCESSED_DIR = VIJUL_ENGINE_DIR / "data" / "processed"

_wwe.DATA_DIR = WORKOUTS_DIR
_wwe.TEMPLATES_PATH = WORKOUTS_DIR / "workout_templates.csv"
_wwe.VARIATIONS_PATH = WORKOUTS_DIR / "exercise_variations.csv"
_wwe.STRENGTH_ITEMS_PATH = WORKOUTS_DIR / "strength_session_items.csv"
_wwe.SCHEDULE_RULES_PATH = WORKOUTS_DIR / "lifestyle_schedule_rules.csv"
_wwe.PROGRESSION_RULES_PATH = WORKOUTS_DIR / "progression_rules.csv"
_wwe.ACCESSIBILITY_PROFILES_PATH = WORKOUTS_DIR / "accessibility_profiles.csv"
_wwe.ACCESSIBILITY_RESOURCES_PATH = WORKOUTS_DIR / "accessibility_resources.csv"
_wwe.ACCESSIBILITY_TEMPLATES_PATH = WORKOUTS_DIR / "accessibility_workout_templates.csv"
_wwe.ACCESSIBILITY_GUIDANCE_PATH = WORKOUTS_DIR / "accessibility_exercise_guidance.csv"
_wwe.ACCESSIBILITY_PROGRESSION_PATH = WORKOUTS_DIR / "accessibility_progression_rules.csv"

_wmp.PROCESSED_DIR = PROCESSED_DIR
_wmp.FOODS_PATH = PROCESSED_DIR / "foods_100_final.csv"
_wmp.MEALS_PATH = PROCESSED_DIR / "meals.csv"
_wmp.MEAL_ITEMS_PATH = PROCESSED_DIR / "meal_items.csv"


class FitnessEngineService:
    """Thin wrapper service orchestrating the authoritative vijul-engine."""

    @staticmethod
    def profile_context_from_row(
        row: dict[str, Any]
    ) -> dict[str, Any]:
        """Builds engine inputs from a committed profile row.

        The committed row is the only source: no default demographics or
        activity lists are invented here.
        """
        required = {
            "age": row.get("age"),
            "sex": row.get("sex"),
            "height_cm": row.get("height_cm"),
            "weight_kg": row.get("weight_kg"),
            "fitness_goal": row.get("fitness_goal"),
            "lifestyle_activity": row.get("lifestyle_activity"),
            "diet": row.get("diet"),
        }
        missing = [key for key, value in required.items() if value in (None, "")]
        if missing:
            raise ValueError(
                "Your assessment is incomplete. Complete all required questions "
                f"before generating a plan (missing: {', '.join(missing)})."
            )
        activities = row.get("preferred_activities") or []
        if not activities:
            raise ValueError(
                "Select at least one preferred activity before generating a plan."
            )

        needs = list(row.get("accessibility_needs") or [])
        notes = []
        if row.get("has_exercise_restriction"):
            notes.append(
                "Your exercise-restriction note is preserved for your coach "
                "and profile; UniFit does not auto-diagnose or silently adapt "
                "prescriptions from free text."
            )
        if "other" in needs:
            notes.append(
                "Your 'other' accessibility note is stored and surfaced to "
                "the session, but is not used to infer an adaptation."
            )
        # W04 decision (user-confirmed): keep multi-select; the engine adapts
        # around the most restrictive need while the UI honors presentation
        # needs for every selected need.
        primary = (
            next((n for n in ("blind_low_vision", "deaf_hard_of_hearing", "other") if n in needs), None)
            or ("none" if not needs or needs == ["none"] else needs[0])
        )
        resources = row.get("blind_low_vision_resources") or []
        return {
            "profile": FitnessEngineService.create_user_profile(
                age=required["age"],
                sex=required["sex"],
                height_cm=required["height_cm"],
                weight_kg=required["weight_kg"],
                goal=required["fitness_goal"],
                lifestyle_activity=required["lifestyle_activity"],
                diet=required["diet"],
            ),
            "activities": [str(a) for a in activities],
            "accessibility_id": primary,
            "accessibility_resources": [str(r) for r in resources],
            "strength_equipment": [str(e) for e in (row.get("strength_equipment") or [])],
            "strength_experience": row.get("strength_experience"),
            "notes": notes,
            "profile_revision": int(row.get("profile_revision") or 1),
        }

    @staticmethod
    def create_user_profile(
        age: int,
        sex: str,
        height_cm: float,
        weight_kg: float,
        goal: str,
        lifestyle_activity: str,
        diet: str,
    ) -> EngineUserProfile:
        """Constructs an engine UserProfile dataclass instance."""
        normalized_goal = "fat_loss" if goal in ("fat_loss", "lose_fat") else goal
        return EngineUserProfile(
            age=int(age),
            sex=sex.lower(),  # type: ignore[arg-type]
            height_cm=float(height_cm),
            weight_kg=float(weight_kg),
            goal=normalized_goal,  # type: ignore[arg-type]
            lifestyle_activity=lifestyle_activity.lower(),  # type: ignore[arg-type]
            diet=diet.lower(),  # type: ignore[arg-type]
        )

    @staticmethod
    def generate_full_week(
        profile: EngineUserProfile,
        preferences: list[str],
        week_number: int = 1,
        previous_progress: Optional[EngineProgressState | dict] = None,
        initial_strength_levels: Optional[dict[str, int]] = None,
        accessibility_id: str = "none",
        accessibility_resources: Optional[list[str]] = None,
        strength_equipment: Optional[list[str]] = None,
        strength_experience: Optional[str] = None,
    ) -> dict[str, Any]:
        """Calls the engine's full pipeline: workout plan + daily nutrition + meal plan."""
        return generate_full_fitness_week(
            profile=profile,
            preferences=preferences,
            week_number=week_number,
            previous_progress=previous_progress,
            initial_strength_levels=initial_strength_levels,
            accessibility_id=accessibility_id,
            accessibility_resources=accessibility_resources or [],
            strength_equipment=strength_equipment,
            strength_experience=strength_experience,
        )

    @staticmethod
    def generate_weekly_workout(
        lifestyle: str,
        preferences: list[str],
        week_number: int = 1,
        previous_progress: Optional[EngineProgressState | dict] = None,
        initial_strength_levels: Optional[dict[str, int]] = None,
        accessibility_id: str = "none",
        accessibility_resources: Optional[list[str]] = None,
        strength_equipment: Optional[list[str]] = None,
        strength_experience: Optional[str] = None,
    ) -> dict[str, Any]:
        """Generates the 7-day adaptive workout plan."""
        return generate_weekly_workout_plan(
            lifestyle=lifestyle,
            preferences=preferences,
            week_number=week_number,
            previous_progress=previous_progress,
            initial_strength_levels=initial_strength_levels,
            accessibility_id=accessibility_id,
            accessibility_resources=accessibility_resources or [],
            strength_equipment=strength_equipment,
            strength_experience=strength_experience,
        )

    @staticmethod
    def calculate_baseline(profile: EngineUserProfile) -> BaselineNutritionTargets:
        """Calculates BMR and baseline energy maintenance."""
        return calculate_baseline_targets(profile)

    @staticmethod
    def calculate_daily_nutrition(
        profile: EngineUserProfile,
        workout: EngineDailyWorkout,
    ) -> DailyNutritionTargets:
        """Calculates exact macro/calorie targets for a single daily workout."""
        return calculate_daily_targets(profile, workout)

    @staticmethod
    def calculate_weekly_nutrition(
        profile: EngineUserProfile,
        workout_plan: dict[str, Any],
    ) -> WeeklyNutritionPlan:
        """Calculates 7-day nutrition targets consuming an existing workout plan."""
        return calculate_weekly_nutrition_targets(profile, workout_plan)

    @staticmethod
    def generate_weekly_meals(combined_week: dict[str, Any]) -> WeeklyMealPlan:
        """Generates a 7-day portion-scaled meal plan."""
        return generate_weekly_meal_plan(combined_week)


# Global singleton instance
engine_service = FitnessEngineService()

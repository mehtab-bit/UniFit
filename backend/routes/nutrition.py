"""Nutrition API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime
from backend.schemas.progress import WeeklyPlanRequest
from backend.schemas.nutrition import (
    WeeklyNutritionPlanResponse,
    DailyNutritionTargetsSchema,
)
from backend.services.engine_service import engine_service
from backend.services.supabase_service import supabase_service
from backend.routes.deps import require_user_dependency
from backend.services.auth_service import VerifiedUser, resolve_user_id

router = APIRouter(prefix="/nutrition", tags=["Nutrition"])


@router.post("/weekly", response_model=WeeklyNutritionPlanResponse)
def get_weekly_nutrition_plan(
    request: WeeklyPlanRequest,
    verified: VerifiedUser = Depends(require_user_dependency),
):
    user_id = resolve_user_id(verified, request.user_id)
    try:
        engine_profile = engine_service.create_user_profile(
            age=request.profile.age,
            sex=request.profile.sex,
            height_cm=request.profile.height_cm,
            weight_kg=request.profile.weight_kg,
            goal=request.profile.normalized_goal(),
            lifestyle_activity=request.profile.lifestyle_activity,
            diet=request.profile.diet,
        )

        workout_plan = engine_service.generate_weekly_workout(
            lifestyle=engine_profile.lifestyle_activity,
            preferences=request.activity_preferences,
            week_number=request.week_number,
            previous_progress=request.previous_progress,
            initial_strength_levels=request.initial_strength_levels,
            accessibility_id=request.profile.accessibility_id,
            accessibility_resources=request.accessibility_resources,
        )

        nutrition_plan = engine_service.calculate_weekly_nutrition(
            profile=engine_profile,
            workout_plan=workout_plan,
        )

        return WeeklyNutritionPlanResponse(**nutrition_plan.to_dict())
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{date}", response_model=DailyNutritionTargetsSchema)
def get_nutrition_by_date(
    date: str,
    user_id: str = Query("user_default"),
    week_number: int = Query(1),
    verified: VerifiedUser = Depends(require_user_dependency),
):
    user_id = resolve_user_id(verified, user_id)
    try:
        parsed_date = datetime.strptime(date, "%Y-%m-%d")
        day_names = [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
        ]
        target_day_name = day_names[parsed_date.weekday()]

        cached = supabase_service.get_cached_weekly_plan(user_id, week_number)
        if cached and "nutrition" in cached:
            for day in cached["nutrition"]:
                if day["day"].lower() == target_day_name:
                    return DailyNutritionTargetsSchema(**day["nutrition"])

        # Fallback: calculate default targets
        profile = engine_service.create_user_profile(
            age=25,
            sex="male",
            height_cm=175,
            weight_kg=70,
            goal="maintain",
            lifestyle_activity="light",
            diet="vegetarian",
        )
        workout_plan = engine_service.generate_weekly_workout(
            lifestyle="light",
            preferences=["running", "cycling"],
            week_number=week_number,
        )
        nutrition_plan = engine_service.calculate_weekly_nutrition(profile, workout_plan)
        for day in nutrition_plan.days:
            if day.day.lower() == target_day_name:
                return DailyNutritionTargetsSchema(**day.nutrition)

        raise HTTPException(status_code=404, detail=f"No nutrition found for {target_day_name}")
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {date}") from val_err
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

"""Meals and Meal Plan API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime
from backend.schemas.progress import WeeklyPlanRequest
from backend.schemas.meal import WeeklyMealPlanResponse, MealPlanDaySchema
from backend.services.engine_service import engine_service
from backend.services.supabase_service import supabase_service
from backend.routes.deps import require_user_dependency
from backend.services.auth_service import VerifiedUser, resolve_user_id

router = APIRouter(prefix="/meals", tags=["Meals"])


@router.post("/weekly", response_model=WeeklyMealPlanResponse)
def get_weekly_meal_plan(
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

        full_week = engine_service.generate_full_week(
            profile=engine_profile,
            preferences=request.activity_preferences,
            week_number=request.week_number,
            previous_progress=request.previous_progress,
            initial_strength_levels=request.initial_strength_levels,
            accessibility_id=request.profile.accessibility_id,
            accessibility_resources=request.accessibility_resources,
        )

        return WeeklyMealPlanResponse(**full_week["meal_plan"])
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{date}", response_model=MealPlanDaySchema)
def get_meals_by_date(
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
        if cached and "meals" in cached:
            for day in cached["meals"]:
                if day["day"].lower() == target_day_name:
                    return MealPlanDaySchema(**day)

        # Fallback: generate default meal plan
        profile = engine_service.create_user_profile(
            age=25,
            sex="male",
            height_cm=175,
            weight_kg=70,
            goal="maintain",
            lifestyle_activity="light",
            diet="vegetarian",
        )
        full_week = engine_service.generate_full_week(
            profile=profile,
            preferences=["running", "cycling"],
            week_number=week_number,
        )
        for day in full_week["meal_plan"]["days"]:
            if day["day"].lower() == target_day_name:
                return MealPlanDaySchema(**day)

        raise HTTPException(status_code=404, detail=f"No meals found for {target_day_name}")
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {date}") from val_err
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

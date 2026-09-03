"""Combined weekly fitness plan endpoint (Workout + Nutrition + Meals)."""

from fastapi import APIRouter, HTTPException
from backend.schemas.progress import WeeklyPlanRequest, CombinedWeeklyPlanResponse
from backend.services.engine_service import engine_service
from backend.services.supabase_service import supabase_service

router = APIRouter(prefix="/fitness", tags=["Fitness Plan"])


@router.post("/weekly-plan", response_model=CombinedWeeklyPlanResponse)
def generate_combined_weekly_plan(request: WeeklyPlanRequest):
    try:
        user_id = request.user_id or "user_default"

        # Check cache if exists to prevent redundant generation
        cached = supabase_service.get_cached_weekly_plan(user_id, request.week_number)
        if cached:
            return CombinedWeeklyPlanResponse(**cached)

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

        workout_plan = full_week["workout_plan"]
        nutrition_plan = full_week["nutrition_plan"]
        meal_plan = full_week["meal_plan"]

        response_data = {
            "week_number": full_week["week_number"],
            "user_id": user_id,
            "user": full_week["user"],
            "workouts": workout_plan["days"],
            "nutrition": nutrition_plan["days"],
            "meals": meal_plan["days"],
            "progression_decisions": workout_plan.get("progression_decisions", {}),
            "strength_exercise_decisions": workout_plan.get(
                "strength_exercise_decisions", {}
            ),
            "accessibility_unavailable_slots": workout_plan.get(
                "accessibility_unavailable_slots", []
            ),
        }

        # Cache the generated plan
        supabase_service.cache_weekly_plan(user_id, request.week_number, response_data)

        return CombinedWeeklyPlanResponse(**response_data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

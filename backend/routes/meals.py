"""Meals and Meal Plan API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from datetime import datetime
from backend.schemas.progress import WeeklyPlanRequest
from backend.schemas.meal import WeeklyMealPlanResponse, MealPlanDaySchema
from backend.schemas.meal import (
    MealLogEntryCreate,
    MealLogEntryResponse,
    MealLogEntryUpdate,
    FoodSearchResult,
)
from backend.services.engine_service import engine_service
from backend.services.supabase_service import supabase_service
from backend.routes.deps import require_user_dependency
from backend.services.auth_service import VerifiedUser, resolve_user_id

router = APIRouter(prefix="/meals", tags=["Meals"])


def _log_entry_response(row: dict) -> dict:
    snapshot = row.get("nutrition_snapshot") or {}
    return {
        "id": str(row.get("id")),
        "user_id": row.get("user_id"),
        "local_date": str(row.get("local_date"))[:10],
        "meal_type": row.get("meal_type"),
        "source": row.get("source"),
        "plan_meal_id": row.get("plan_meal_id"),
        "food_code": row.get("food_code"),
        "custom_name": row.get("custom_name"),
        "quantity": float(row.get("quantity") or 0),
        "quantity_unit": row.get("quantity_unit") or "serving",
        "nutrition": {
            "calories_kcal": snapshot.get("calories_kcal"),
            "protein_g": snapshot.get("protein_g"),
            "carbohydrates_g": snapshot.get("carbohydrates_g"),
            "fat_g": snapshot.get("fat_g"),
            "fibre_g": snapshot.get("fibre_g"),
            "carbohydrate_complete": bool(
                snapshot.get("carbohydrate_complete")
                or (row.get("completeness_flags") or {}).get(
                    "carbohydrate_complete", False
                )
            ),
            "fiber_complete": bool(
                snapshot.get("fiber_complete")
                or (row.get("completeness_flags") or {}).get(
                    "fiber_complete", False
                )
            ),
        },
        "notes": row.get("notes"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


@router.get("/logs", response_model=list[MealLogEntryResponse])
def list_meal_logs(
    local_date: str | None = Query(default=None),
    verified: VerifiedUser = Depends(require_user_dependency),
):
    user_id = resolve_user_id(verified, None)
    rows = supabase_service.list_meal_log_entries(user_id, local_date)
    return [_log_entry_response(row) for row in rows]


@router.get("/foods", response_model=list[FoodSearchResult])
def search_foods(
    q: str = Query(default=""),
    limit: int = Query(default=20, ge=1, le=50),
):
    return supabase_service.search_foods(q, limit)


@router.post("/logs", response_model=MealLogEntryResponse)
def create_meal_log(
    request: MealLogEntryCreate,
    verified: VerifiedUser = Depends(require_user_dependency),
):
    user_id = resolve_user_id(verified, None)
    row = supabase_service.create_meal_log_entry(
        {
            "user_id": user_id,
            "local_date": request.local_date,
            "meal_type": request.meal_type,
            "source": request.source,
            "plan_meal_id": request.plan_meal_id,
            "food_code": request.food_code,
            "custom_name": request.custom_name,
            "quantity": request.quantity,
            "quantity_unit": request.quantity_unit,
            "nutrition_snapshot": request.nutrition.model_dump(),
            "completeness_flags": {
                "carbohydrate_complete": request.nutrition.carbohydrate_complete,
                "fiber_complete": request.nutrition.fiber_complete,
            },
            "notes": request.notes,
        }
    )
    return MealLogEntryResponse.model_validate(_log_entry_response(row))


@router.put("/logs/{entry_id}", response_model=MealLogEntryResponse)
def update_meal_log(
    entry_id: str,
    request: MealLogEntryUpdate,
    verified: VerifiedUser = Depends(require_user_dependency),
):
    user_id = resolve_user_id(verified, None)
    updates = request.model_dump(exclude_unset=True)
    nutrition = updates.pop("nutrition", None)
    if nutrition:
        updates["nutrition_snapshot"] = nutrition
        updates["completeness_flags"] = {
            "carbohydrate_complete": nutrition.get("carbohydrate_complete", False),
            "fiber_complete": nutrition.get("fiber_complete", False),
        }
    row = supabase_service.update_meal_log_entry(user_id, entry_id, updates)
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal entry not found.",
        )
    return MealLogEntryResponse.model_validate(_log_entry_response(row))


@router.delete("/logs/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal_log(
    entry_id: str,
    verified: VerifiedUser = Depends(require_user_dependency),
):
    user_id = resolve_user_id(verified, None)
    deleted = supabase_service.delete_meal_log_entry(user_id, entry_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal entry not found.",
        )


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

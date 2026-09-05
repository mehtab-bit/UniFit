"""Combined weekly fitness plan endpoint (Workout + Nutrition + Meals)."""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from uuid import NAMESPACE_URL, uuid5
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from backend.schemas.progress import (
    WeeklyPlanRequest,
    CombinedWeeklyPlanResponse,
)
from backend.services.engine_service import (
    engine_service,
    ENGINE_VERSION,
    RULE_DATA_VERSION,
)
from backend.services.supabase_service import supabase_service
from backend.services.progression_service import progression_service
from backend.routes.deps import require_user_dependency
from backend.services.auth_service import VerifiedUser, resolve_user_id

router = APIRouter(prefix="/fitness", tags=["Fitness Plan"])
logger = logging.getLogger("unifit.fitness")

DAY_NAMES = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
]


def monday_for_week(start: Optional[str]) -> str:
    """Returns the Monday of the requested or current local week (YYYY-MM-DD)."""
    if start:
        try:
            parsed = datetime.strptime(start, "%Y-%m-%d").date()
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="week_start_date must be YYYY-MM-DD.",
            ) from exc
        return (parsed - timedelta(days=parsed.weekday())).isoformat()
    today = date.today()
    return (today - timedelta(days=today.weekday())).isoformat()


def scheduled_workout_id(user_id: str, local_date: str) -> str:
    return str(uuid5(NAMESPACE_URL, f"unifit://scheduled/{user_id}/{local_date}"))


def _date_for_index(monday_iso: str, index: int) -> str:
    return (datetime.strptime(monday_iso, "%Y-%m-%d").date() + timedelta(days=index)).isoformat()


@router.post("/weekly-plan", response_model=CombinedWeeklyPlanResponse)
def generate_combined_weekly_plan(
    request: WeeklyPlanRequest,
    verified: VerifiedUser = Depends(require_user_dependency),
):
    user_id = resolve_user_id(verified, request.user_id)
    use_server_profile = request.use_server_profile or request.profile is None

    if use_server_profile:
        committed = supabase_service.get_profile(user_id)
        if not committed:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Complete your assessment before generating a plan.",
            )
        if not committed.get("onboarding_completed"):
            raise HTTPException(
                status_code=status.HTTP_428_PRECONDITION_REQUIRED,
                detail="Your assessment is not complete. Finish it to generate a plan.",
            )
        context = engine_service.profile_context_from_row(committed)
        engine_profile = context["profile"]
        activities = context["activities"]
        accessibility_id = context["accessibility_id"]
        accessibility_resources = context["accessibility_resources"]
        strength_equipment = context["strength_equipment"]
        strength_experience = context["strength_experience"]
        profile_revision = context["profile_revision"]
        if (
            request.expected_profile_revision is not None
            and request.expected_profile_revision != profile_revision
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Profile changed after this plan request started. Refresh and try again.",
            )
    else:
        if not request.profile:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="A profile payload or use_server_profile=true is required.",
            )
        engine_profile = engine_service.create_user_profile(
            age=request.profile.age,
            sex=request.profile.sex,
            height_cm=request.profile.height_cm,
            weight_kg=request.profile.weight_kg,
            goal=request.profile.normalized_goal(),
            lifestyle_activity=request.profile.lifestyle_activity,
            diet=request.profile.diet,
        )
        activities = request.activity_preferences
        accessibility_id = request.profile.accessibility_id
        accessibility_resources = request.accessibility_resources
        strength_equipment = None
        strength_experience = None
        profile_revision = 0

    progression = progression_service.get_progress_state(user_id)
    progression_revision = int(
        progression.get("progression_revision") or 1
    ) if isinstance(progression, dict) else 1

    if request.week_number is not None:
        week_number = request.week_number
    elif use_server_profile:
        week_number = int(progression.get("calendar_week") or 1) if isinstance(progression, dict) else 1
    else:
        week_number = 1

    monday_iso = monday_for_week(request.week_start_date)
    # APP-04: normal generation must use the user's durable progression, not a
    # client-supplied previous_progress snapshot.
    previous_progress = (
        progression if use_server_profile else request.previous_progress
    )

    # Legacy path (older clients supply an inline profile). Keep user/week cache
    # semantics and no plan-snapshot identity.
    if not use_server_profile:
        try:
            if request.force_regenerate:
                supabase_service.invalidate_weekly_plan(user_id, week_number)
            else:
                cached = supabase_service.get_cached_weekly_plan(user_id, week_number)
                if cached:
                    return CombinedWeeklyPlanResponse(**cached)

            full_week = engine_service.generate_full_week(
                profile=engine_profile,
                preferences=activities,
                week_number=week_number,
                previous_progress=previous_progress,
                initial_strength_levels=request.initial_strength_levels,
                accessibility_id=accessibility_id,
                accessibility_resources=accessibility_resources,
                strength_equipment=strength_equipment,
                strength_experience=strength_experience,
            )
            response_data = _build_response_data(
                user_id, full_week, week_number, monday_iso
            )
            supabase_service.cache_weekly_plan(user_id, week_number, response_data)
            return CombinedWeeklyPlanResponse(**response_data)
        except HTTPException:
            raise
        except Exception as exc:
            logger.exception("Legacy weekly-plan generation failed")
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    # Revision-aware server path: reuse an identical active snapshot, otherwise
    # generate and persist a new one (superseding older snapshots for the week).
    snapshot = supabase_service.get_active_plan_snapshot(user_id, monday_iso)
    if (
        snapshot
        and not request.force_regenerate
        and int(snapshot.get("profile_revision") or 0) == profile_revision
        and int(snapshot.get("progression_revision") or 0) == progression_revision
        and snapshot.get("engine_version") == ENGINE_VERSION
        and snapshot.get("rule_data_version") == RULE_DATA_VERSION
    ):
        response_data = dict(snapshot["plan_data"])
        response_data["plan_id"] = snapshot["id"]
        response_data["generation_status"] = "cached"
        return CombinedWeeklyPlanResponse(**response_data)

    try:
        # In server mode, experience (not a client-supplied map) sets the
        # starting variation level.
        server_initial_levels = (
            None if use_server_profile else request.initial_strength_levels
        )
        full_week = engine_service.generate_full_week(
            profile=engine_profile,
            preferences=activities,
            week_number=week_number,
            previous_progress=previous_progress,
            initial_strength_levels=server_initial_levels,
            accessibility_id=accessibility_id,
            accessibility_resources=accessibility_resources,
            strength_equipment=strength_equipment,
            strength_experience=strength_experience,
        )
        response_data = _build_response_data(
            user_id, full_week, week_number, monday_iso
        )
        response_data.update(
            {
                "plan_id": "",
                "week_start_date": monday_iso,
                "profile_revision": profile_revision,
                "progression_revision": progression_revision,
                "engine_version": ENGINE_VERSION,
                "rule_data_version": RULE_DATA_VERSION,
                "generation_status": "generated",
                "personalization_notes": context.get("notes", []),
            }
        )
        scheduled_workouts = _scheduled_rows(
            user_id,
            response_data.get("workouts") or [],
            monday_iso,
        )
        stored = supabase_service.save_plan_snapshot(
            user_id,
            {
                "user_id": user_id,
                "week_start_date": monday_iso,
                "week_number": week_number,
                "profile_revision": profile_revision,
                "progression_revision": progression_revision,
                "engine_version": ENGINE_VERSION,
                "rule_data_version": RULE_DATA_VERSION,
                "plan_data": response_data,
                "scheduled_workouts": scheduled_workouts,
            },
        )
        response_data["plan_id"] = stored["id"]
        return CombinedWeeklyPlanResponse(**response_data)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Server-profile weekly-plan generation failed")
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def _build_response_data(
    user_id: str,
    full_week: dict[str, Any],
    week_number: int,
    monday_iso: str,
) -> dict[str, Any]:
    workout_plan = full_week["workout_plan"]
    nutrition_plan = full_week["nutrition_plan"]
    meal_plan = full_week["meal_plan"]
    workouts = list(workout_plan["days"])
    for index, day in enumerate(workouts):
        local_date = _date_for_index(monday_iso, index)
        day["local_date"] = local_date
        day["scheduled_workout_id"] = scheduled_workout_id(user_id, local_date)
    return {
        "week_number": full_week["week_number"],
        "user_id": user_id,
        "user": full_week["user"],
        "workouts": workouts,
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


def _scheduled_rows(
    user_id: str, workouts: list[dict[str, Any]], monday_iso: str
) -> list[dict[str, Any]]:
    rows = []
    for index, day in enumerate(workouts):
        local_date = day.get("local_date") or _date_for_index(monday_iso, index)
        workout = day.get("workout") or {}
        rows.append(
            {
                "id": scheduled_workout_id(user_id, local_date),
                "local_date": local_date,
                "activity_id": workout.get("activity_id")
                or ("rest" if day.get("is_rest_day") else "strength"),
                "requested_activity_id": workout.get("requested_activity_id"),
                "progression_key": workout.get("progression_key"),
                "session_type": workout.get("session_type"),
                "is_rest_day": bool(day.get("is_rest_day")),
                "prescription": workout,
            }
        )
    return rows

"""Progress and Streak API endpoints."""

from fastapi import APIRouter, Query
from backend.schemas.progress import StreakResponse, ProgressSummaryResponse
from backend.services.progression_service import progression_service

router = APIRouter(tags=["Progress & Streak"])


@router.get("/streak", response_model=StreakResponse)
def get_streak(user_id: str = Query("user_default")):
    state = progression_service.get_progress_state(user_id)
    logged_count = state["logged_sessions_count"]

    return StreakResponse(
        user_id=user_id,
        current_streak=max(5, logged_count),
        best_streak=12,
        weekly_adherence_pct=83.3,
        active_days_this_week=min(4, logged_count),
        total_active_days_target=4,
    )


@router.get("/progress", response_model=ProgressSummaryResponse)
def get_progress(user_id: str = Query("user_default")):
    state = progression_service.get_progress_state(user_id)

    return ProgressSummaryResponse(
        user_id=user_id,
        current_week=state["calendar_week"],
        monthly_consistency_pct=83.0,
        activity_rule_week=state["activity_rule_week"],
        exercise_rule_week=state["exercise_rule_week"],
        strength_variation_levels=state["strength_variation_levels"],
        logged_sessions_count=state["logged_sessions_count"],
        recent_activity_completions=state["activity_completion_pct"],
    )

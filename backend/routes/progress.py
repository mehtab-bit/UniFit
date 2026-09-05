"""Progress and Streak API endpoints."""

from fastapi import APIRouter, Depends, Query
from typing import Any, Optional
from datetime import date, datetime, timedelta
from backend.schemas.progress import StreakResponse, ProgressSummaryResponse
from backend.services.progression_service import progression_service
from backend.services.supabase_service import supabase_service
from backend.routes.deps import require_user_dependency
from backend.services.auth_service import VerifiedUser, resolve_user_id

router = APIRouter(tags=["Progress & Streak"])
session_router = APIRouter(tags=["Sessions"])


def _compute_streaks(logs: list[dict]) -> tuple[int, int]:
    """Computes current and best consecutive-day streaks from session dates."""
    days: set[date] = set()
    for log in logs:
        created = log.get("created_at")
        if not created:
            continue
        try:
            days.add(datetime.fromisoformat(str(created).replace("Z", "+00:00")).date())
        except (ValueError, TypeError):
            continue

    if not days:
        return 0, 0

    sorted_days = sorted(days)
    best = 1
    run = 1
    for prev, cur in zip(sorted_days, sorted_days[1:]):
        if (cur - prev).days == 1:
            run += 1
            best = max(best, run)
        else:
            run = 1

    # Current streak: consecutive days ending today or yesterday (today not yet logged).
    today = datetime.now().date()
    current = 0
    walk = today
    if today not in days and (today - timedelta(days=1)) in days:
        walk = today - timedelta(days=1)
    while walk in days:
        current += 1
        walk -= timedelta(days=1)

    return current, best


@router.get("/streak", response_model=StreakResponse)
def get_streak(
    user_id: str = Query("user_default"),
    verified: VerifiedUser = Depends(require_user_dependency),
):
    user_id = resolve_user_id(verified, user_id)
    state = progression_service.get_progress_state(user_id)
    logs = progression_service.get_session_logs(user_id)
    current_streak, best_streak = _compute_streaks(logs)

    today = datetime.now().date()
    this_week_start = today - timedelta(days=today.weekday())
    # Count distinct days, not sessions.
    active_days_this_week = sum(
        1
        for log in logs
        if log.get("created_at")
        and datetime.fromisoformat(str(log["created_at"]).replace("Z", "+00:00")).date()
        >= this_week_start
    )
    weekly_adherence = (
        round(active_days_this_week / 4 * 100, 1) if active_days_this_week else 0.0
    )

    return StreakResponse(
        user_id=user_id,
        current_streak=current_streak,
        best_streak=best_streak,
        weekly_adherence_pct=weekly_adherence,
        active_days_this_week=active_days_this_week,
        total_active_days_target=4,
    )


@router.get("/progress", response_model=ProgressSummaryResponse)
def get_progress(
    user_id: str = Query("user_default"),
    verified: VerifiedUser = Depends(require_user_dependency),
):
    user_id = resolve_user_id(verified, user_id)
    state = progression_service.get_progress_state(user_id)

    logged = state["logged_sessions_count"]
    # Monthly consistency = logged days this calendar month / elapsed days.
    today = datetime.now().date()
    elapsed_days = today.day
    month_days = {
        datetime.fromisoformat(str(log["created_at"]).replace("Z", "+00:00")).date()
        for log in progression_service.get_session_logs(user_id)
        if log.get("created_at")
    }
    active_month_days = sum(
        1 for d in month_days if d.year == today.year and d.month == today.month
    )
    monthly_consistency = (
        round(active_month_days / max(elapsed_days, 1) * 100, 1)
        if active_month_days
        else 0.0
    )

    return ProgressSummaryResponse(
        user_id=user_id,
        current_week=state["calendar_week"],
        monthly_consistency_pct=monthly_consistency,
        activity_rule_week=state["activity_rule_week"],
        exercise_rule_week=state["exercise_rule_week"],
        strength_variation_levels=state["strength_variation_levels"],
        logged_sessions_count=logged,
        recent_activity_completions=state["activity_completion_pct"],
    )


@session_router.get("/sessions")
def get_sessions(
    user_id: str = Query("user_default"),
    verified: VerifiedUser = Depends(require_user_dependency),
):
    """Returns the user's actual logged workout sessions, newest first."""
    user_id = resolve_user_id(verified, user_id)
    sessions = supabase_service.load_workout_sessions(user_id)
    sessions.sort(key=lambda s: str(s.get("created_at") or ""), reverse=True)
    return {"sessions": sessions}

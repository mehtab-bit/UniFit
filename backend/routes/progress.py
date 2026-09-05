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


def _session_day(log: dict) -> Optional[date]:
    local = log.get("local_date")
    if local:
        try:
            return datetime.strptime(str(local)[:10], "%Y-%m-%d").date()
        except ValueError:
            pass
    created = log.get("created_at")
    if created:
        try:
            return datetime.fromisoformat(
                str(created).replace("Z", "+00:00")
            ).date()
        except (ValueError, TypeError):
            pass
    return None


def _issued_week_schedule(user_id: str, week_start: date) -> tuple[int, int, set[date]]:
    """Returns (planned active target, due obligations, issued dates) from the
    active plan snapshot. When no snapshot exists the schedule is unknown and
    no fixed target is invented."""
    snapshot = supabase_service.get_active_plan_snapshot(
        user_id, week_start.isoformat()
    )
    if not snapshot:
        return 0, 0, set()
    workouts = (snapshot.get("plan_data") or {}).get("workouts") or []
    issued: set[date] = set()
    for day in workouts:
        if day.get("is_rest_day"):
            continue
        local = day.get("local_date")
        if not local:
            continue
        try:
            issued.add(datetime.strptime(str(local)[:10], "%Y-%m-%d").date())
        except ValueError:
            continue
    today = datetime.now().date()
    due = {d for d in issued if d <= today}
    return len(issued), len(due), issued


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
    # Count distinct active days (never sessions on one day).
    active_days = {
        day for day in (_session_day(log) for log in logs) if day is not None
    }
    active_days_this_week = sum(
        1 for d in active_days if this_week_start <= d < this_week_start + timedelta(days=7)
    )
    target_active_days, due_count, _issued = _issued_week_schedule(
        user_id, this_week_start
    )
    # Adherence uses the actual issued obligations that are due; an
    # unissued/future obligation is never counted as missed.
    weekly_adherence = (
        round(
            min(active_days_this_week, due_count) / max(due_count, 1) * 100,
            1,
        )
        if due_count
        else 0.0
    )

    return StreakResponse(
        user_id=user_id,
        current_streak=current_streak,
        best_streak=best_streak,
        weekly_adherence_pct=weekly_adherence,
        active_days_this_week=active_days_this_week,
        total_active_days_target=target_active_days,
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
        day
        for day in (
            _session_day(log)
            for log in progression_service.get_session_logs(user_id)
        )
        if day is not None
    }
    month_days.update(
        day
        for day in (
            _session_day(log)
            for log in supabase_service.list_activity_logs(user_id)
        )
        if day is not None
    )
    active_month_days = sum(
        1 for d in month_days if d.year == today.year and d.month == today.month
    )
    session_logs = progression_service.get_session_logs(user_id)
    all_dates = {
        day
        for day in (_session_day(log) for log in session_logs)
        if day is not None
    }
    all_dates.update(
        day
        for day in (
            _session_day(log)
            for log in supabase_service.list_activity_logs(user_id)
        )
        if day is not None
    )
    milestones = []
    if len(all_dates) >= 1:
        milestones.append(
            {
                "id": "first_active_day",
                "title": "First Active Day",
                "date": min(all_dates).isoformat(),
                "status": "Completed",
            }
        )
    if len(all_dates) >= 3:
        milestones.append(
            {
                "id": "three_active_days",
                "title": "3 Active Days",
                "date": sorted(all_dates)[2].isoformat(),
                "status": "Completed",
            }
        )
    if len(all_dates) >= 5:
        milestones.append(
            {
                "id": "five_active_days",
                "title": "5 Active Days",
                "date": sorted(all_dates)[4].isoformat(),
                "status": "Completed",
            }
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
        milestones=milestones,
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

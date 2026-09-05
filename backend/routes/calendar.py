"""Real calendar endpoint backed by issued plan snapshots and sessions."""

from __future__ import annotations

import calendar as pycalendar
from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from backend.routes.deps import require_user_dependency
from backend.services.auth_service import VerifiedUser, resolve_user_id
from backend.services.supabase_service import supabase_service

router = APIRouter(tags=["Calendar"])


def _local_date_key(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    try:
        return datetime.strptime(str(value)[:10], "%Y-%m-%d").date()
    except ValueError:
        return None


@router.get("/calendar")
def get_calendar(
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    user_id: str = Query("user_default"),
    verified: VerifiedUser = Depends(require_user_dependency),
):
    user_id = resolve_user_id(verified, user_id)
    today = date.today()
    first = date(year, month, 1)
    last = date(year, month, pycalendar.monthrange(year, month)[1])

    # A plan week can start before the month; pull the whole previous week so
    # its Monday-Sunday block still covers early month days.
    snapshots = supabase_service.list_active_plan_snapshots_between(
        user_id,
        (first - timedelta(days=6)).isoformat(),
        last.isoformat(),
    )
    sessions = supabase_service.load_workout_sessions(user_id)
    profile_row = supabase_service.get_profile(user_id)
    program_start = _local_date_key(
        (profile_row or {}).get("created_at")
        or (profile_row or {}).get("updated_at")
    )
    completed_dates = {
        d
        for d in (
            _local_date_key(row.get("local_date"))
            or _local_date_key(row.get("created_at"))
            for row in sessions
        )
        if d is not None
    }

    plan_by_date: dict[str, dict] = {}
    for snapshot in snapshots:
        week_start = snapshot.get("week_start_date")
        if not week_start:
            continue
        plan_data = snapshot.get("plan_data") or {}
        workouts = plan_data.get("workouts") or []
        nutrition_days = plan_data.get("nutrition") or []
        nutrition_by_day = {}
        for nutrition_day in nutrition_days:
            local = nutrition_day.get("local_date")
            if local:
                nutrition_by_day[str(local)[:10]] = (
                    nutrition_day.get("nutrition") or {}
                )
        for day in workouts:
            local = day.get("local_date")
            local_date = _local_date_key(local)
            if (
                not local_date
                or not (first <= local_date <= last)
                or (program_start and local_date < program_start)
            ):
                continue
            workout = day.get("workout") or {}
            is_rest = bool(day.get("is_rest_day"))
            date_key = str(local)[:10]
            plan_by_date[date_key] = {
                "date": date_key,
                "dayNumber": local_date.day,
                "status": "today"
                if date_key == today.isoformat()
                else "rest"
                if is_rest
                else "completed"
                if local_date in completed_dates
                else "planned",
                "workoutTitle": "Rest Day"
                if is_rest
                else workout.get("title")
                or workout.get("activity_name"),
                "workoutMeta": None,
                "activity": "rest" if is_rest else workout.get("activity_id"),
                "durationMinutes": workout.get("duration_min"),
                "isCurrentMonth": True,
                "nutritionSummary": nutrition_by_day.get(date_key),
            }

    days = []
    for day_number in range(1, pycalendar.monthrange(year, month)[1] + 1):
        date_key = date(year, month, day_number).isoformat()
        plan = plan_by_date.get(date_key)
        if plan:
            days.append(plan)
        else:
            days.append(
                {
                    "date": date_key,
                    "dayNumber": day_number,
                    "status": "rest",
                    "workoutTitle": "No session scheduled yet",
                    "isCurrentMonth": True,
                }
            )
    return {"days": days, "year": year, "month": month}

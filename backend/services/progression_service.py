"""
UniFit Progression Service.

Evaluates the 80% progression gates and tracks independent strength exercise
variation levels using the authoritative logic in weekly_workout_engine.py.
When an issued plan snapshot exists, weekly completion is calculated against
that plan (planned obligations are the denominator) rather than averaging only
the logs that happened to be submitted.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from typing import Any, Optional

from engine.weekly_workout_engine import (
    ProgressState,
    summarize_week_completion,
    summarize_planned_week,
    activity_can_progress,
    determine_rule_week,
    determine_strength_exercise_rule_week,
    STRENGTH_FAMILIES,
    PROGRESSION_THRESHOLD,
)
from backend.services.supabase_service import supabase_service


@dataclass
class UserProgressionRecord:
    user_id: str
    calendar_week: int = 1
    progression_revision: int = 1
    session_logs: list[dict[str, Any]] = field(default_factory=list)
    state: ProgressState = field(default_factory=ProgressState)


def _as_local_date(value: Any) -> Optional[date]:
    if not value:
        return None
    try:
        if isinstance(value, date):
            return value
        text = str(value)
        if "T" in text or " " in text:
            return datetime.fromisoformat(text.replace("Z", "+00:00")).date()
        return datetime.strptime(text[:10], "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None


def _monday(local: date) -> str:
    return (local - timedelta(days=local.weekday())).isoformat()


class ProgressionService:
    """Manages progression state and workout completions."""

    def __init__(self):
        self._user_records: dict[str, UserProgressionRecord] = {}
        self._records_loaded = False

    def _ensure_records_loaded(self) -> None:
        """Lazily restores history on first access instead of at import/startup."""
        if self._records_loaded:
            return
        self._records_loaded = True
        try:
            self._load_all_records()
        except Exception as exc:
            print(f"[ProgressionService] Failed to restore session history: {exc}")

    def _load_all_records(self) -> None:
        """Rebuilds in-memory progression state from Supabase session history."""
        if not (supabase_service.is_connected and supabase_service.client):
            return
        try:
            resp = (
                supabase_service.client.table("user_workout_sessions")
                .select("*")
                .order("created_at", desc=True)
                .execute()
            )
            sessions = list(resp.data or [])
            for session in sessions:
                user_id = session.get("user_id")
                if not user_id:
                    continue
                record = self.get_or_create_record(user_id)
                record.session_logs.append(self._normalize_log(session))
            for record in list(self._user_records.values()):
                summary = self._summarize(record.user_id, record.session_logs)
                record.state.overall_completion_pct = summary.overall_completion_pct
                record.state.activity_completion_pct = summary.activity_completion_pct
                record.state.exercise_completion_pct = summary.exercise_completion_pct
        except Exception as exc:
            print(f"[ProgressionService] Failed to load session history: {exc}")

    def get_or_create_record(self, user_id: str) -> UserProgressionRecord:
        self._ensure_records_loaded()
        if user_id not in self._user_records:
            self._user_records[user_id] = UserProgressionRecord(user_id=user_id)
        return self._user_records[user_id]

    @staticmethod
    def _normalize_log(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "activity_id": row.get("activity_id"),
            "requested_activity_id": row.get("requested_activity_id"),
            "progression_key": row.get("progression_key")
            or row.get("activity_id"),
            "session_type": row.get("session_type"),
            "completion_pct": float(row.get("completion_pct") or 0),
            "exercise_completion_pct": row.get("exercise_completion_pct", {}) or {},
            "source": row.get("source"),
            "reps_completed": row.get("reps_completed"),
            "range_score": row.get("range_score"),
            "issue_codes": row.get("issue_codes"),
            "operation_id": row.get("operation_id"),
            "scheduled_workout_id": row.get("scheduled_workout_id"),
            "local_date": row.get("local_date"),
            "created_at": row.get("created_at"),
        }

    @staticmethod
    def _plan_obligations(
        user_id: str, week_start: str
    ) -> list[dict[str, Any]]:
        snapshot = supabase_service.get_active_plan_snapshot(user_id, week_start)
        if not snapshot:
            return []
        workouts = (snapshot.get("plan_data") or {}).get("workouts") or []
        obligations = []
        for day in workouts:
            if day.get("is_rest_day"):
                continue
            workout = day.get("workout") or {}
            exercises = workout.get("exercises") or []
            obligations.append(
                {
                    "scheduled_workout_id": day.get("scheduled_workout_id"),
                    "local_date": day.get("local_date"),
                    "day": day.get("day"),
                    "activity_id": workout.get("activity_id"),
                    "requested_activity_id": workout.get("requested_activity_id"),
                    "progression_key": workout.get("progression_key"),
                    "session_type": workout.get("session_type"),
                    "exercises": exercises,
                }
            )
        return obligations

    def _summarize(
        self, user_id: str, logs: list[dict[str, Any]]
    ) -> ProgressState:
        if not logs:
            return ProgressState(overall_completion_pct=0.0)

        # Prefer the issued plan for the week containing the most recent log.
        dates = [_as_local_date(log.get("local_date") or log.get("created_at")) for log in logs]
        latest = max((d for d in dates if d), default=date.today())
        week_start = _monday(latest)
        obligations = self._plan_obligations(user_id, week_start)
        if obligations:
            week_attempts = [
                log
                for log in logs
                if _as_local_date(log.get("local_date") or log.get("created_at"))
                and _monday(_as_local_date(log.get("local_date") or log.get("created_at")) or date.today())
                == week_start
            ]
            return summarize_planned_week(obligations, week_attempts)
        return summarize_week_completion(logs)

    def record_completion(
        self,
        user_id: str,
        activity_id: str,
        progression_key: str,
        completion_pct: float,
        requested_activity_id: Optional[str] = None,
        session_type: Optional[str] = None,
        exercise_completion_pct: Optional[dict[str, float]] = None,
        source: str = "camera",
        reps_completed: Optional[int] = None,
        range_score: Optional[float] = None,
        issue_codes: Optional[list[str]] = None,
        operation_id: Optional[str] = None,
        scheduled_workout_id: Optional[str] = None,
        local_date: Optional[str] = None,
        started_at: Optional[str] = None,
        ended_at: Optional[str] = None,
        active_duration_seconds: Optional[int] = None,
        notes: Optional[str] = None,
    ) -> dict[str, Any]:
        """Records a workout attempt and recomputes progression metrics."""

        record = self.get_or_create_record(user_id)

        def build_response(duplicate: bool = False) -> dict[str, Any]:
            summary = self._summarize(user_id, record.session_logs)
            record.state.overall_completion_pct = summary.overall_completion_pct
            record.state.activity_completion_pct.update(summary.activity_completion_pct)
            record.state.exercise_completion_pct.update(summary.exercise_completion_pct)
            can_advance = activity_can_progress(
                record.state, progression_key or activity_id
            )
            exercise_advances = {
                family: bool(
                    (record.state.overall_completion_pct or 0)
                    >= PROGRESSION_THRESHOLD
                    and (record.state.exercise_completion_pct.get(family) or 0)
                    >= PROGRESSION_THRESHOLD
                )
                for family in STRENGTH_FAMILIES
                if record.state.exercise_completion_pct.get(family) is not None
            }
            return {
                "success": True,
                "duplicate": duplicate,
                "user_id": user_id,
                "activity_id": activity_id,
                "progression_key": progression_key or activity_id,
                "completion_pct": completion_pct,
                "overall_completion_pct": record.state.overall_completion_pct,
                "activity_can_progress": can_advance,
                "exercise_advances": exercise_advances,
                "total_logged_sessions": len(record.session_logs),
                "current_state": record.state.to_dict(),
            }

        if operation_id:
            existing = supabase_service.get_workout_session_by_operation_id(
                user_id, operation_id
            )
            if existing:
                return build_response(duplicate=True)

        session_log = {
            "activity_id": activity_id,
            "requested_activity_id": requested_activity_id,
            "progression_key": progression_key or activity_id,
            "session_type": session_type,
            "completion_pct": float(completion_pct),
            "exercise_completion_pct": exercise_completion_pct or {},
            "source": source,
            "reps_completed": reps_completed,
            "range_score": range_score,
            "issue_codes": issue_codes,
            "operation_id": operation_id,
            "scheduled_workout_id": scheduled_workout_id,
            "local_date": local_date,
            "started_at": started_at,
            "ended_at": ended_at,
            "active_duration_seconds": active_duration_seconds,
            "notes": notes,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        persisted = supabase_service.save_workout_session(
            {**session_log, "user_id": user_id}
        )
        if not persisted:
            # A successful response must mean the database committed the
            # recording. Callers keep their local pending queue and retry.
            raise ValueError(
                "Unable to save this session. Your progress is safe on this "
                "device and will sync when the connection is restored."
            )

        record.session_logs.append(session_log)
        response = build_response()
        record.state.activity_rule_week = record.state.activity_rule_week
        record.state.exercise_rule_week = record.state.exercise_rule_week
        record.state.strength_variation_levels = (
            record.state.strength_variation_levels
        )
        supabase_service.save_progress_state(
            user_id,
            {
                "calendar_week": record.calendar_week,
                "overall_completion_pct": record.state.overall_completion_pct,
                "activity_rule_week": record.state.activity_rule_week,
                "exercise_rule_week": record.state.exercise_rule_week,
                "strength_variation_levels": record.state.strength_variation_levels,
                "progression_revision": record.progression_revision,
            },
        )
        return response

    def advance_to_next_week(self, user_id: str) -> ProgressState:
        """Calculates rule weeks for the next program week."""
        record = self.get_or_create_record(user_id)
        next_cal_week = record.calendar_week + 1

        record.state.activity_rule_week = {
            key: determine_rule_week(
                progression_key=key,
                calendar_week=next_cal_week,
                previous_state=record.state,
            )
            for key in list(record.state.activity_completion_pct.keys())
        }
        record.state.exercise_rule_week = {
            family: determine_strength_exercise_rule_week(
                family=family,
                calendar_week=next_cal_week,
                previous_state=record.state,
            )
            for family in STRENGTH_FAMILIES
        }
        record.calendar_week = next_cal_week
        record.progression_revision += 1
        record.session_logs = []
        record.state.overall_completion_pct = None
        record.state.activity_completion_pct = {}
        record.state.exercise_completion_pct = {}

        supabase_service.save_progress_state(
            user_id,
            {
                "calendar_week": record.calendar_week,
                "overall_completion_pct": record.state.overall_completion_pct,
                "activity_rule_week": record.state.activity_rule_week,
                "exercise_rule_week": record.state.exercise_rule_week,
                "strength_variation_levels": record.state.strength_variation_levels,
                "progression_revision": record.progression_revision,
            },
        )
        return record.state

    def get_progress_state(self, user_id: str) -> dict[str, Any]:
        record = self.get_or_create_record(user_id)
        return {
            "user_id": user_id,
            "calendar_week": record.calendar_week,
            "progression_revision": record.progression_revision,
            "overall_completion_pct": record.state.overall_completion_pct,
            "activity_completion_pct": record.state.activity_completion_pct,
            "exercise_completion_pct": record.state.exercise_completion_pct,
            "activity_rule_week": record.state.activity_rule_week,
            "exercise_rule_week": record.state.exercise_rule_week,
            "strength_variation_levels": record.state.strength_variation_levels,
            "logged_sessions_count": len(record.session_logs),
        }

    def get_session_logs(self, user_id: str) -> list[dict[str, Any]]:
        """Returns the user's raw session logs oldest first."""
        record = self.get_or_create_record(user_id)
        if not record.session_logs:
            record.session_logs = [
                self._normalize_log(row)
                for row in supabase_service.load_workout_sessions(user_id)
            ]
        return sorted(
            record.session_logs,
            key=lambda s: s.get("created_at") or "",
        )


progression_service = ProgressionService()

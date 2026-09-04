"""
UniFit Progression Service.

Orchestrates progression state, evaluates the 80% progression gates,
and tracks independent strength exercise variation levels using the
authoritative logic in weekly_workout_engine.py.
"""

from __future__ import annotations

from typing import Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timezone

from engine.weekly_workout_engine import (
    ProgressState,
    summarize_week_completion,
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
    session_logs: list[dict[str, Any]] = field(default_factory=list)
    state: ProgressState = field(default_factory=ProgressState)


class ProgressionService:
    """Manages progression state and workout completions."""

    def __init__(self):
        # In-memory user progression store (backed by Supabase when configured)
        self._user_records: dict[str, UserProgressionRecord] = {}
        self._load_all_records()

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
                record.session_logs.append(
                    {
                        "activity_id": session.get("activity_id"),
                        "requested_activity_id": session.get("requested_activity_id"),
                        "progression_key": session.get("progression_key")
                        or session.get("activity_id"),
                        "session_type": session.get("session_type"),
                        "completion_pct": float(session.get("completion_pct") or 0),
                        "exercise_completion_pct": session.get(
                            "exercise_completion_pct", {}
                        )
                        or {},
                        "created_at": session.get("created_at"),
                    }
                )
            # Recompute aggregate state per user from their session history.
            for record in self._user_records.values():
                summary_state = summarize_week_completion(record.session_logs)
                record.state.overall_completion_pct = (
                    summary_state.overall_completion_pct
                )
                record.state.activity_completion_pct.update(
                    summary_state.activity_completion_pct
                )
                record.state.exercise_completion_pct.update(
                    summary_state.exercise_completion_pct
                )
        except Exception as e:
            print(f"[ProgressionService] Failed to load session history: {e}")

    def get_or_create_record(self, user_id: str) -> UserProgressionRecord:
        if user_id not in self._user_records:
            self._user_records[user_id] = UserProgressionRecord(user_id=user_id)
        return self._user_records[user_id]

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
    ) -> dict[str, Any]:
        """
        Records a completed workout session log and recomputes progression metrics.
        The backend owns the 80% progression decision.
        """
        record = self.get_or_create_record(user_id)

        session_log = {
            "activity_id": activity_id,
            "requested_activity_id": requested_activity_id,
            "progression_key": progression_key or activity_id,
            "session_type": session_type,
            "completion_pct": float(completion_pct),
            "exercise_completion_pct": exercise_completion_pct or {},
            "source": source,
            "reps_completed": reps_completed,
        }

        record.session_logs.append(session_log)
        session_log["created_at"] = datetime.now(timezone.utc).isoformat()

        # Persist the session so streaks/progress survive restarts.
        supabase_service.save_workout_session(
            {
                "user_id": user_id,
                "activity_id": session_log["activity_id"],
                "requested_activity_id": session_log["requested_activity_id"],
                "progression_key": session_log["progression_key"],
                "session_type": session_log["session_type"],
                "completion_pct": session_log["completion_pct"],
                "exercise_completion_pct": session_log["exercise_completion_pct"],
                "source": session_log["source"],
                "reps_completed": session_log["reps_completed"],
                "created_at": session_log["created_at"],
            }
        )

        # Re-summarize week using the engine function
        summary_state = summarize_week_completion(record.session_logs)

        # Merge summary completion metrics into current progression state
        record.state.overall_completion_pct = summary_state.overall_completion_pct
        record.state.activity_completion_pct.update(summary_state.activity_completion_pct)
        record.state.exercise_completion_pct.update(summary_state.exercise_completion_pct)

        # Check if this activity passed the 80% progression threshold
        can_advance = activity_can_progress(record.state, progression_key or activity_id)

        # Evaluate individual exercise family progression
        exercise_advances: dict[str, bool] = {}
        for family in STRENGTH_FAMILIES:
            ex_pct = record.state.exercise_completion_pct.get(family)
            if ex_pct is not None:
                exercise_advances[family] = bool(
                    (record.state.overall_completion_pct or 0) >= PROGRESSION_THRESHOLD
                    and ex_pct >= PROGRESSION_THRESHOLD
                )

        # Persist the recomputed progression state.
        supabase_service.save_progress_state(
            user_id,
            {
                "calendar_week": record.calendar_week,
                "overall_completion_pct": record.state.overall_completion_pct,
                "activity_rule_week": record.state.activity_rule_week,
                "exercise_rule_week": record.state.exercise_rule_week,
                "strength_variation_levels": record.state.strength_variation_levels,
            },
        )

        return {
            "success": True,
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

    def advance_to_next_week(self, user_id: str) -> ProgressState:
        """
        Calculates rule weeks for the subsequent calendar week based on completion history.
        """
        record = self.get_or_create_record(user_id)
        current_cal_week = record.calendar_week
        next_cal_week = current_cal_week + 1

        new_activity_rule_weeks = {}
        for key in list(record.state.activity_completion_pct.keys()):
            new_activity_rule_weeks[key] = determine_rule_week(
                progression_key=key,
                calendar_week=next_cal_week,
                previous_state=record.state,
            )

        new_exercise_rule_weeks = {}
        for family in STRENGTH_FAMILIES:
            new_exercise_rule_weeks[family] = determine_strength_exercise_rule_week(
                family=family,
                calendar_week=next_cal_week,
                previous_state=record.state,
            )

        # Transition record
        record.calendar_week = next_cal_week
        record.session_logs = []
        record.state.activity_rule_week.update(new_activity_rule_weeks)
        record.state.exercise_rule_week.update(new_exercise_rule_weeks)
        record.state.overall_completion_pct = None
        record.state.activity_completion_pct = {}
        record.state.exercise_completion_pct = {}

        return record.state

    def get_progress_state(self, user_id: str) -> dict[str, Any]:
        record = self.get_or_create_record(user_id)
        return {
            "user_id": user_id,
            "calendar_week": record.calendar_week,
            "overall_completion_pct": record.state.overall_completion_pct,
            "activity_completion_pct": record.state.activity_completion_pct,
            "exercise_completion_pct": record.state.exercise_completion_pct,
            "activity_rule_week": record.state.activity_rule_week,
            "exercise_rule_week": record.state.exercise_rule_week,
            "strength_variation_levels": record.state.strength_variation_levels,
            "logged_sessions_count": len(record.session_logs),
        }

    def get_session_logs(self, user_id: str) -> list[dict[str, Any]]:
        """Returns the user's raw session logs (oldest first for streak math)."""
        record = self.get_or_create_record(user_id)
        return sorted(
            record.session_logs,
            key=lambda s: s.get("created_at") or "",
        )


progression_service = ProgressionService()

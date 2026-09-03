"""
UniFit Progression Service.

Orchestrates progression state, evaluates the 80% progression gates,
and tracks independent strength exercise variation levels using the
authoritative logic in weekly_workout_engine.py.
"""

from __future__ import annotations

from typing import Any, Optional
from dataclasses import dataclass, field

from engine.weekly_workout_engine import (
    ProgressState,
    summarize_week_completion,
    activity_can_progress,
    determine_rule_week,
    determine_strength_exercise_rule_week,
    STRENGTH_FAMILIES,
    PROGRESSION_THRESHOLD,
)


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
        }

        record.session_logs.append(session_log)

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


progression_service = ProgressionService()

"""W06 tests: plan-denominator progression and W05 idempotent recording."""

from __future__ import annotations

import os
from uuid import uuid4

os.environ["UNIFIT_AUTH_MODE"] = "dev"
os.environ["UNIFIT_PERSISTENCE"] = "offline"

import pytest
from fastapi.testclient import TestClient

from engine.weekly_workout_engine import summarize_planned_week
from backend.main import app
from backend.routes.deps import require_user_dependency
from backend.services.auth_service import VerifiedUser

client = TestClient(app)


def obligations(count: int = 5):
    return [
        {
            "scheduled_workout_id": f"00000000-0000-0000-0000-{i:012d}",
            "local_date": f"2026-09-{7 + i:02d}",
            "activity_id": "strength" if i % 2 == 0 else "running",
            "progression_key": "strength" if i % 2 == 0 else "running",
            "exercises": (
                [
                    {"family": "squat"},
                    {"family": "pushup"},
                ]
                if i % 2 == 0
                else []
            ),
        }
        for i in range(count)
    ]


def test_unattempted_obligations_count_against_plan():
    attempts = [
        {
            "scheduled_workout_id": "00000000-0000-0000-0000-000000000000",
            "completion_pct": 100.0,
        }
    ]
    state = summarize_planned_week(obligations(5), attempts)
    assert state.overall_completion_pct == 20.0


def test_five_logs_on_one_day_stay_one_active_obligation():
    attempts = [
        {
            "scheduled_workout_id": "00000000-0000-0000-0000-000000000000",
            "completion_pct": 100.0,
        }
        for _ in range(5)
    ]
    state = summarize_planned_week(obligations(5), attempts)
    assert state.overall_completion_pct == 20.0


def test_repeated_attempts_cannot_inflate_beyond_obligation():
    attempts = [
        {
            "scheduled_workout_id": "00000000-0000-0000-0000-000000000000",
            "completion_pct": 60.0,
        },
        {
            "scheduled_workout_id": "00000000-0000-0000-0000-000000000000",
            "completion_pct": 100.0,
        },
    ]
    state = summarize_planned_week(obligations(5), attempts)
    assert state.overall_completion_pct == 20.0


def test_no_plan_returns_no_invented_denominator():
    state = summarize_planned_week([], [])
    assert state.overall_completion_pct is None


def test_completion_endpoint_is_idempotent_by_operation_id():
    user_id = str(uuid4())
    app.dependency_overrides[require_user_dependency] = lambda: VerifiedUser(
        id=user_id, mode="live"
    )
    payload = {
        "operation_id": str(uuid4()),
        "scheduled_workout_id": str(uuid4()),
        "local_date": "2026-09-07",
        "activity_id": "strength",
        "progression_key": "strength",
        "completion_pct": 100.0,
        "exercise_completion_pct": {
            "squat": 100.0,
            "pushup": 100.0,
            "lunge": 100.0,
            "bicep_curl": 100.0,
            "supported_row": 100.0,
        },
        "source": "manual",
    }
    try:
        first = client.post("/api/v1/workout/complete", json=payload)
        assert first.status_code == 200, first.text
        assert first.json()["duplicate"] is False
        assert first.json()["total_logged_sessions"] == 1

        second = client.post("/api/v1/workout/complete", json=payload)
        assert second.status_code == 200, second.text
        assert second.json()["duplicate"] is True
        assert second.json()["total_logged_sessions"] == 1
    finally:
        app.dependency_overrides.pop(require_user_dependency, None)

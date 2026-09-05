"""W06 calendar tests: issued snapshots (not demo templates) drive the grid."""

from __future__ import annotations

import os
from uuid import uuid4

os.environ["UNIFIT_AUTH_MODE"] = "dev"
os.environ["UNIFIT_PERSISTENCE"] = "offline"

from fastapi.testclient import TestClient

from backend.main import app
from backend.routes.deps import require_user_dependency
from backend.services.auth_service import VerifiedUser
from backend.services.supabase_service import supabase_service

client = TestClient(app)
USER_ID = str(uuid4())


def login():
    app.dependency_overrides[require_user_dependency] = lambda: VerifiedUser(
        id=USER_ID, mode="live"
    )


def seed_strength_week():
    supabase_service.save_plan_snapshot(
        USER_ID,
        {
            "user_id": USER_ID,
            "week_start_date": "2026-09-07",
            "week_number": 1,
            "profile_revision": 1,
            "progression_revision": 1,
            "engine_version": "1.0.0",
            "rule_data_version": "rules",
            "plan_data": {
                "workouts": [
                    {
                        "day": "monday",
                        "local_date": "2026-09-07",
                        "scheduled_workout_id": "00000000-0000-0000-0000-000000000007",
                        "is_rest_day": False,
                        "workout": {
                            "activity_id": "strength",
                            "title": "Full Body Strength Session",
                            "duration_min": 25,
                        },
                    },
                    {
                        "day": "tuesday",
                        "local_date": "2026-09-08",
                        "scheduled_workout_id": "00000000-0000-0000-0000-000000000008",
                        "is_rest_day": True,
                    },
                ],
                "nutrition": [],
            },
            "scheduled_workouts": [],
        },
    )


def test_calendar_uses_issued_plan_not_template():
    login()
    try:
        seed_strength_week()
        response = client.get("/api/v1/calendar?year=2026&month=9")
        assert response.status_code == 200, response.text
        days = {day["date"]: day for day in response.json()["days"]}
        assert days["2026-09-07"]["workoutTitle"] == "Full Body Strength Session"
        assert days["2026-09-07"]["activity"] == "strength"
        assert days["2026-09-08"]["status"] == "rest"
        assert "cycling" not in str(days.get("2026-09-06") or {})
    finally:
        app.dependency_overrides.pop(require_user_dependency, None)

"""W03 tests: revision-aware server-profile plan identity."""

from __future__ import annotations

import os
from uuid import uuid4

os.environ["UNIFIT_AUTH_MODE"] = "dev"
os.environ["UNIFIT_PERSISTENCE"] = "offline"

from fastapi.testclient import TestClient

from backend.main import app
from backend.routes.deps import require_user_dependency
from backend.services.auth_service import VerifiedUser

client = TestClient(app)
USER_ID = str(uuid4())


def login_as_user():
    app.dependency_overrides[require_user_dependency] = lambda: VerifiedUser(
        id=USER_ID, mode="live"
    )


def logout_user():
    app.dependency_overrides.pop(require_user_dependency, None)


def commit_profile():
    response = client.put(
        "/api/v1/profile/me",
        json={
            "full_name": "Plan Identity Tester",
            "age": 25,
            "sex": "male",
            "height_cm": 175.0,
            "weight_kg": 70.0,
            "fitness_goal": "maintain",
            "lifestyle_activity": "light",
            "diet": "vegetarian",
            "preferred_activities": ["running", "cycling"],
            "accessibility_needs": [],
            "strength_equipment": ["dumbbells"],
            "strength_experience": "new",
            "onboarding_completed": True,
        },
    )
    assert response.status_code == 200, response.text
    return response.json()["profile_revision"]


def request_plan():
    return client.post(
        "/api/v1/fitness/weekly-plan",
        json={
            "week_start_date": "2026-09-07",
            "use_server_profile": True,
        },
    )


def test_server_profile_plan_has_revision_identity_and_dates():
    login_as_user()
    try:
        commit_profile()
        response = request_plan()
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["generation_status"] == "generated"
        assert body["profile_revision"] == 1
        assert body["progression_revision"] == 1
        assert body["engine_version"]
        assert body["rule_data_version"]
        assert body["plan_id"]
        assert body["week_start_date"] == "2026-09-07"
        dates = [day["local_date"] for day in body["workouts"]]
        assert dates[0] == "2026-09-07"
        assert dates[6] == "2026-09-13"
        assert all(day["scheduled_workout_id"] for day in body["workouts"])
    finally:
        logout_user()


def test_identical_plan_request_reuses_snapshot():
    login_as_user()
    try:
        first = request_plan().json()
        second = request_plan()
        assert second.status_code == 200, second.text
        assert second.json()["plan_id"] == first["plan_id"]
        assert second.json()["generation_status"] == "cached"
    finally:
        logout_user()


def test_profile_edit_generates_new_plan_revision():
    login_as_user()
    try:
        old = request_plan().json()
        old_plan_id = old["plan_id"]
        old_revision = old["profile_revision"]
        put = client.put(
            "/api/v1/profile/me",
            json={
                "full_name": "Plan Identity Tester",
                "age": 26,
                "sex": "male",
                "height_cm": 175.0,
                "weight_kg": 70.0,
                "fitness_goal": "maintain",
                "lifestyle_activity": "light",
                "diet": "vegetarian",
                "preferred_activities": ["running", "cycling"],
                "accessibility_needs": [],
                "strength_equipment": ["dumbbells"],
                "strength_experience": "new",
                "onboarding_completed": True,
                "expected_profile_revision": old_revision,
            },
        )
        assert put.status_code == 200, put.text
        new_revision = put.json()["profile_revision"]
        regenerated = request_plan()
        assert regenerated.status_code == 200, regenerated.text
        body = regenerated.json()
        assert body["profile_revision"] == new_revision
        assert body["plan_id"] != old_plan_id
    finally:
        logout_user()

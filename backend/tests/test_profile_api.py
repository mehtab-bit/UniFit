"""W02 tests: committed profile contract and optimistic concurrency."""

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


def as_user():
    app.dependency_overrides[require_user_dependency] = lambda: VerifiedUser(
        id=USER_ID, mode="live"
    )


def clear_override():
    app.dependency_overrides.pop(require_user_dependency, None)


def full_profile_payload(**overrides):
    payload = {
        "full_name": "Test Athlete",
        "age": 24,
        "sex": "female",
        "height_cm": 165.0,
        "weight_kg": 58.0,
        "fitness_goal": "muscle_gain",
        "lifestyle_activity": "light",
        "diet": "vegetarian",
        "preferred_activities": ["walking", "cycling"],
        "accessibility_needs": ["blind_low_vision", "deaf_hard_of_hearing"],
        "accessibility_other_details": "Likes spoken cues with captions",
        "blind_low_vision_resources": ["safe_indoor_space", "stable_support"],
        "has_exercise_restriction": True,
        "exercise_restriction_description": "Knee discomfort, no diagnosis",
        "strength_equipment": ["dumbbells", "resistance_bands"],
        "strength_equipment_other": "",
        "strength_experience": "some_experience",
        "onboarding_completed": True,
    }
    payload.update(overrides)
    return payload


def test_missing_profile_returns_404():
    other = str(uuid4())
    app.dependency_overrides[require_user_dependency] = lambda: VerifiedUser(
        id=other, mode="live"
    )
    try:
        response = client.get("/api/v1/profile/me")
        assert response.status_code == 404, response.text
    finally:
        clear_override()


def test_profile_round_trips_all_quiz_fields():
    as_user()
    try:
        put = client.put("/api/v1/profile/me", json=full_profile_payload())
        assert put.status_code == 200, put.text
        body = put.json()
        assert body["profile_revision"] == 1
        assert body["onboarding_completed"] is True
        assert body["preferred_activities"] == ["walking", "cycling"]
        assert body["accessibility_needs"] == [
            "blind_low_vision",
            "deaf_hard_of_hearing",
        ]
        assert body["blind_low_vision_resources"] == [
            "safe_indoor_space",
            "stable_support",
        ]
        assert body["accessibility_other_details"] == "Likes spoken cues with captions"
        assert body["exercise_restriction_description"] == "Knee discomfort, no diagnosis"
        assert body["strength_equipment"] == ["dumbbells", "resistance_bands"]
        assert body["strength_experience"] == "some_experience"

        got = client.get("/api/v1/profile/me")
        assert got.status_code == 200, got.text
        assert got.json()["profile_revision"] == 1
        assert got.json()["preferred_activities"] == ["walking", "cycling"]
        assert got.json()["fitness_goal"] == "muscle_gain"
    finally:
        clear_override()


def test_second_edit_increments_revision():
    as_user()
    try:
        first = client.put("/api/v1/profile/me", json=full_profile_payload())
        assert first.status_code == 200
        revision = first.json()["profile_revision"]
        second = client.put(
            "/api/v1/profile/me",
            json=full_profile_payload(
                expected_profile_revision=revision,
                preferred_activities=[],
                accessibility_needs=["none"],
            ),
        )
        assert second.status_code == 200, second.text
        assert second.json()["profile_revision"] == revision + 1
        assert second.json()["preferred_activities"] == []
        assert second.json()["accessibility_needs"] == ["none"]
    finally:
        clear_override()


def test_stale_edit_conflicts_with_409():
    as_user()
    try:
        first = client.put("/api/v1/profile/me", json=full_profile_payload())
        assert first.status_code == 200
        stale = first.json()["profile_revision"]
        client.put("/api/v1/profile/me", json=full_profile_payload())
        conflict = client.put(
            "/api/v1/profile/me",
            json=full_profile_payload(expected_profile_revision=stale),
        )
        assert conflict.status_code == 409, conflict.text
    finally:
        clear_override()


def test_partial_incomplete_profile_is_stored_not_defaulted():
    as_user()
    try:
        put = client.put(
            "/api/v1/profile/me",
            json={
                "full_name": "New User",
                "onboarding_completed": False,
                "preferred_activities": [],
            },
        )
        assert put.status_code == 200, put.text
        body = put.json()
        assert body["onboarding_completed"] is False
        assert body["age"] is None
        assert body["fitness_goal"] is None
    finally:
        clear_override()

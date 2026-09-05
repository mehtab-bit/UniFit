"""W10 tests: authenticated meal-log CRUD and nutrition snapshots."""

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


def as_user(user_id: str):
    app.dependency_overrides[require_user_dependency] = lambda: VerifiedUser(
        id=user_id, mode="live"
    )


def clear():
    app.dependency_overrides.pop(require_user_dependency, None)


def entry_payload(**overrides):
    payload = {
        "local_date": "2026-09-07",
        "meal_type": "breakfast",
        "source": "custom",
        "custom_name": "Oats with banana",
        "quantity": 1.5,
        "quantity_unit": "serving",
        "nutrition": {
            "calories_kcal": 420.0,
            "protein_g": 14.0,
            "carbohydrates_g": 60.0,
            "fat_g": 12.0,
            "fibre_g": None,
            "carbohydrate_complete": True,
            "fiber_complete": False,
        },
        "notes": "Measured approximate",
    }
    payload.update(overrides)
    return payload


def test_meal_log_round_trip_update_and_delete():
    user_id = str(uuid4())
    as_user(user_id)
    try:
        created = client.post("/api/v1/meals/logs", json=entry_payload())
        assert created.status_code == 200, created.text
        body = created.json()
        assert body["nutrition"]["calories_kcal"] == 420.0
        assert body["nutrition"]["carbohydrate_complete"] is True
        assert body["nutrition"]["fiber_complete"] is False

        listed = client.get("/api/v1/meals/logs?local_date=2026-09-07")
        assert listed.status_code == 200
        assert len(listed.json()) == 1

        updated = client.put(
            f"/api/v1/meals/logs/{body['id']}",
            json={
                "quantity": 2.0,
                "nutrition": {
                    "calories_kcal": 560.0,
                    "protein_g": 18.7,
                    "carbohydrates_g": 80.0,
                    "fat_g": 16.0,
                    "fibre_g": 5.0,
                    "carbohydrate_complete": True,
                    "fiber_complete": True,
                },
            },
        )
        assert updated.status_code == 200, updated.text
        assert updated.json()["quantity"] == 2.0
        assert updated.json()["nutrition"]["calories_kcal"] == 560.0

        deleted = client.delete(f"/api/v1/meals/logs/{body['id']}")
        assert deleted.status_code == 204
        assert len(client.get("/api/v1/meals/logs?local_date=2026-09-07").json()) == 0
    finally:
        clear()


def test_users_cannot_modify_another_users_meal_entry():
    owner = str(uuid4())
    intruder = str(uuid4())
    as_user(owner)
    try:
        created = client.post("/api/v1/meals/logs", json=entry_payload()).json()
    finally:
        clear()
    as_user(intruder)
    try:
        response = client.put(
            f"/api/v1/meals/logs/{created['id']}",
            json={"notes": "tampered"},
        )
        assert response.status_code == 404, response.text
        response = client.delete(f"/api/v1/meals/logs/{created['id']}")
        assert response.status_code == 404, response.text
    finally:
        clear()

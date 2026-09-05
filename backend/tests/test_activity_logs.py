"""W09 tests: guided/manual activity logging."""

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


def test_activity_log_round_trip_preserves_unknown_calories():
    user_id = str(uuid4())
    as_user(user_id)
    try:
        payload = {
            "activity_type": "walking",
            "local_date": "2026-09-05",
            "source": "guided",
            "operation_id": "op-activity-1",
            "active_duration_seconds": 1500,
            "duration_minutes": 25.0,
            "distance_km": 1.8,
            "distance_entered": True,
            "completed": True,
            "notes": "Measured on treadmill",
        }
        created = client.post("/api/v1/activity/logs", json=payload)
        assert created.status_code == 200, created.text
        body = created.json()
        assert body["activity_type"] == "walking"
        assert body["distance_km"] == 1.8
        assert "calories" not in body

        listed = client.get("/api/v1/activity/logs?local_date=2026-09-05")
        assert listed.status_code == 200
        assert len(listed.json()) == 1
        assert listed.json()[0]["operation_id"] == "op-activity-1"

        updated = client.put(
            f"/api/v1/activity/logs/{body['id']}",
            json={"distance_km": 2.0, "notes": "updated"},
        )
        assert updated.status_code == 200, updated.text
        assert updated.json()["distance_km"] == 2.0

        deleted = client.delete(f"/api/v1/activity/logs/{body['id']}")
        assert deleted.status_code == 204, deleted.text
        assert len(client.get("/api/v1/activity/logs?local_date=2026-09-05").json()) == 0
    finally:
        app.dependency_overrides.pop(require_user_dependency, None)

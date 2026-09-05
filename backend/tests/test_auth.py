"""W01 security tests: JWT verification and per-user ownership."""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from uuid import uuid4

os.environ["UNIFIT_AUTH_MODE"] = "dev"
os.environ["UNIFIT_PERSISTENCE"] = "offline"

import jwt as pyjwt
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.routes.deps import require_user_dependency
from backend.services.auth_service import (
    VerifiedUser,
    resolve_user_id,
    verify_supabase_token,
)

client = TestClient(app)
USER_A = str(uuid4())
USER_B = str(uuid4())
TEST_SECRET = "unit-test-supabase-jwt-secret"


def mint_token(sub: str = USER_A, secret: str = TEST_SECRET, expired: bool = False) -> str:
    now = datetime.now(timezone.utc)
    return pyjwt.encode(
        {
            "sub": sub,
            "aud": "authenticated",
            "role": "authenticated",
            "iat": now,
            "exp": now - timedelta(minutes=5) if expired else now + timedelta(hours=1),
            "iss": "https://unit.supabase.co/auth/v1",
        },
        secret,
        algorithm="HS256",
    )


def test_token_verification_accepts_valid_token(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    result = verify_supabase_token(mint_token(USER_A))
    assert result.id == USER_A
    assert result.mode == "live"


def test_token_verification_rejects_wrong_secret(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    with pytest.raises(Exception) as exc:
        verify_supabase_token(mint_token(USER_A, secret="another-secret"))
    assert exc.value.status_code == 401


def test_token_verification_rejects_expired_token(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    with pytest.raises(Exception) as exc:
        verify_supabase_token(mint_token(USER_A, expired=True))
    assert exc.value.status_code == 401


def test_token_verification_rejects_malformed_token(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    with pytest.raises(Exception) as exc:
        verify_supabase_token("not-a-jwt")
    assert exc.value.status_code == 401


def test_live_resolve_never_accepts_another_user():
    verified = VerifiedUser(id=USER_A, mode="live")
    assert resolve_user_id(verified, USER_A) == USER_A
    with pytest.raises(Exception) as exc:
        resolve_user_id(verified, USER_B)
    assert exc.value.status_code == 403


def test_dev_resolve_accepts_caller_supplied_id():
    verified = VerifiedUser(id="", mode="dev")
    assert resolve_user_id(verified, "engine_test_user") == "engine_test_user"
    assert resolve_user_id(verified, None) == "user_default"


def test_authenticated_route_rejects_cross_user_query():
    app.dependency_overrides[require_user_dependency] = lambda: VerifiedUser(
        id=USER_A, mode="live"
    )
    try:
        response = client.get(f"/api/v1/streak?user_id={USER_B}")
        assert response.status_code == 403, response.text
    finally:
        app.dependency_overrides.pop(require_user_dependency, None)


def test_authenticated_route_allows_own_user_query():
    app.dependency_overrides[require_user_dependency] = lambda: VerifiedUser(
        id=USER_A, mode="live"
    )
    try:
        response = client.get(f"/api/v1/streak?user_id={USER_A}")
        assert response.status_code == 200, response.text
        assert response.json()["user_id"] == USER_A
    finally:
        app.dependency_overrides.pop(require_user_dependency, None)


def test_missing_token_rejected_in_live_mode(monkeypatch):
    monkeypatch.setenv("UNIFIT_AUTH_MODE", "live")
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    response = client.get("/api/v1/streak")
    assert response.status_code == 401, response.text


def test_invalid_token_rejected_in_live_mode(monkeypatch):
    monkeypatch.setenv("UNIFIT_AUTH_MODE", "live")
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    response = client.get(
        "/api/v1/streak", headers={"Authorization": "Bearer not-a-jwt"}
    )
    assert response.status_code == 401, response.text


def test_expired_token_rejected_in_live_mode(monkeypatch):
    monkeypatch.setenv("UNIFIT_AUTH_MODE", "live")
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    token = mint_token(USER_A, expired=True)
    response = client.get(
        "/api/v1/streak", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 401, response.text


def test_legacy_supplied_default_user_rejected_in_live_mode(monkeypatch):
    monkeypatch.setenv("UNIFIT_AUTH_MODE", "live")
    monkeypatch.setenv("SUPABASE_JWT_SECRET", TEST_SECRET)
    token = mint_token(USER_A)
    response = client.get(
        "/api/v1/streak?user_id=user_default",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403, response.text

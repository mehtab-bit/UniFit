"""
Supabase JWT verification and route identity helpers.

Every user-specific backend operation must resolve identity from the
verified access token instead of trusting caller-supplied user_id.

Modes:
  live: bearer token required; token is verified with SUPABASE_JWT_SECRET
        (or, as a fallback, by calling Supabase Auth when explicitly enabled).
  dev:  used for local engine testing / offline development only. No bearer
        token is required and caller-supplied ids are accepted.

Mode selection:
  1. UNIFIT_AUTH_MODE=dev|test|demo  -> dev
  2. UNIFIT_AUTH_MODE=live|secure|prod -> live
  3. SUPABASE_JWT_SECRET is set or live Supabase credentials are configured -> live
  4. otherwise -> dev
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass
from uuid import UUID
from typing import Optional

from fastapi import HTTPException, status

from backend.services.supabase_service import SUPABASE_URL, supabase_service

DEV_MODES = {"dev", "demo", "test", "offline"}
LIVE_MODES = {"live", "secure", "prod", "production"}


@dataclass(frozen=True)
class VerifiedUser:
    """Identity resolved from a verified access token."""

    id: str
    mode: str = "live"


def auth_mode() -> str:
    explicit = (os.getenv("UNIFIT_AUTH_MODE") or "").strip().lower()
    if explicit in DEV_MODES:
        return "dev"
    if explicit in LIVE_MODES:
        return "live"
    if _jwt_secret() or (supabase_service.is_connected and SUPABASE_URL):
        return "live"
    return "dev"


def _jwt_secret() -> str:
    return (os.getenv("SUPABASE_JWT_SECRET") or "").strip()


def _remote_auth_enabled() -> bool:
    return (os.getenv("SUPABASE_AUTH_REMOTE_FALLBACK") or "").strip().lower() in {
        "true",
        "1",
        "yes",
    }


def _valid_uuid(value: str) -> bool:
    try:
        UUID(value)
        return True
    except (ValueError, AttributeError):
        return False


def verify_supabase_token(token: str) -> VerifiedUser:
    """Verifies a Supabase access token and returns its subject."""

    secret = _jwt_secret()
    if secret:
        import jwt as pyjwt

        try:
            payload = pyjwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                options={"require": ["exp", "sub"], "verify_aud": False},
            )
        except pyjwt.ExpiredSignatureError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session has expired. Please sign in again.",
            ) from exc
        except pyjwt.InvalidTokenError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or malformed session token.",
            ) from exc

        aud = payload.get("aud")
        role = payload.get("role")
        if aud not in (None, "authenticated") or role not in (None, "authenticated"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session token is not an authenticated Supabase token.",
            )
        subject = str(payload.get("sub") or "")
        if not _valid_uuid(subject):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session token does not carry a valid user identity.",
            )
        return VerifiedUser(id=subject)

    if _remote_auth_enabled() and supabase_service.client is not None:
        try:
            response = supabase_service.client.auth.get_user(token)
            user = getattr(response, "user", None)
            subject = str(getattr(user, "id", "") or "")
            if not _valid_uuid(subject):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Supabase did not return a valid user for this token.",
                )
            return VerifiedUser(id=subject)
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to verify session token. Please sign in again.",
            ) from exc

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=(
            "Backend authentication is not configured. Set SUPABASE_JWT_SECRET "
            "or enable SUPABASE_AUTH_REMOTE_FALLBACK."
        ),
    )


def resolve_user_id(verified: VerifiedUser, supplied: Optional[str]) -> str:
    """Returns the effective user id for an operation.

    In live mode the caller can never choose a different user: a supplied id
    that conflicts with the verified identity (or the old 'user_default'
    sentinel) is rejected with 403.
    """

    if verified.mode == "dev":
        return (supplied or "").strip() or "user_default"

    if supplied:
        stripped = supplied.strip()
        # user_default is the legacy placeholder clients used before identity
        # enforcement; it is not a claim about another account.
        if stripped == verified.id or stripped == "user_default":
            return verified.id
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Requested user does not match the authenticated session.",
        )
    return verified.id


# Convenience alias used by dependency injection.
require_verified_user = None  # defined in backend/routes/deps.py to avoid an import cycle

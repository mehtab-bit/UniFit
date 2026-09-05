"""Shared FastAPI dependencies for authenticated routes."""

from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.services.auth_service import (
    VerifiedUser,
    auth_mode,
    verify_supabase_token,
)

bearer_scheme = HTTPBearer(auto_error=False)


def require_verified_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> VerifiedUser:
    """Returns the verified identity for a request.

    In dev mode no token is required so engine tests and offline development
    continue to work. Every other environment requires a valid Supabase JWT.
    """

    if auth_mode() == "dev":
        return VerifiedUser(id="", mode="dev")
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in and try again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return verify_supabase_token(credentials.credentials)


require_user_dependency = require_verified_user

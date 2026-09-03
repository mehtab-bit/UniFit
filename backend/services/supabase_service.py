"""
UniFit Supabase Database & Plan Cache Service.

Provides persistence for profiles, weekly plans, and logs with graceful
in-memory caching when running in local development mode.
"""

from __future__ import annotations

import os
from typing import Any, Optional
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("EXPO_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("EXPO_PUBLIC_SUPABASE_ANON_KEY")
    or os.getenv("SUPABASE_KEY", "")
)


class SupabaseService:
    def __init__(self):
        self.is_connected = False
        self.client = None
        self._cached_weekly_plans: dict[str, dict[str, Any]] = {}
        self._cached_profiles: dict[str, dict[str, Any]] = {}

        if (
            SUPABASE_URL
            and "your-project-id" not in SUPABASE_URL
            and SUPABASE_KEY
            and "your-supabase" not in SUPABASE_KEY
        ):
            try:
                from supabase import create_client

                self.client = create_client(SUPABASE_URL, SUPABASE_KEY)
                self.is_connected = True
            except Exception as e:
                print(f"[SupabaseService] Client init failed, using in-memory mode: {e}")
                self.is_connected = False

    def get_cached_weekly_plan(
        self, user_id: str, week_number: int
    ) -> Optional[dict[str, Any]]:
        cache_key = f"{user_id}:week:{week_number}"
        return self._cached_weekly_plans.get(cache_key)

    def cache_weekly_plan(
        self, user_id: str, week_number: int, plan: dict[str, Any]
    ) -> None:
        cache_key = f"{user_id}:week:{week_number}"
        self._cached_weekly_plans[cache_key] = plan

        # Persist to Supabase if connected
        if self.is_connected and self.client:
            try:
                self.client.table("user_weekly_plans").upsert(
                    {
                        "user_id": user_id,
                        "week_number": week_number,
                        "plan_data": plan,
                    },
                    on_conflict="user_id,week_number",
                ).execute()
            except Exception as e:
                print(f"[SupabaseService] Failed to persist plan to Supabase: {e}")

    def invalidate_weekly_plan(self, user_id: str, week_number: int) -> None:
        """Drops a cached plan from memory and Supabase so it regenerates next request."""
        self._cached_weekly_plans.pop(f"{user_id}:week:{week_number}", None)
        if self.is_connected and self.client:
            try:
                (
                    self.client.table("user_weekly_plans")
                    .delete()
                    .eq("user_id", user_id)
                    .eq("week_number", week_number)
                    .execute()
                )
            except Exception as e:
                print(f"[SupabaseService] Failed to invalidate plan in Supabase: {e}")

    def save_profile(self, user_id: str, profile_data: dict[str, Any]) -> None:
        self._cached_profiles[user_id] = profile_data

        if self.is_connected and self.client:
            try:
                self.client.table("profiles").upsert(
                    {
                        "user_id": user_id,
                        **profile_data,
                    },
                    on_conflict="user_id",
                ).execute()
            except Exception as e:
                print(f"[SupabaseService] Failed to upsert profile to Supabase: {e}")

    def get_profile(self, user_id: str) -> Optional[dict[str, Any]]:
        if user_id in self._cached_profiles:
            return self._cached_profiles[user_id]

        if self.is_connected and self.client:
            try:
                resp = (
                    self.client.table("profiles")
                    .select("*")
                    .eq("user_id", user_id)
                    .single()
                    .execute()
                )
                if resp.data:
                    self._cached_profiles[user_id] = resp.data
                    return resp.data
            except Exception:
                pass
        return None

    def load_workout_sessions(self, user_id: str) -> list[dict[str, Any]]:
        """Loads a user's logged workout sessions from Supabase."""
        if self.is_connected and self.client:
            try:
                resp = (
                    self.client.table("user_workout_sessions")
                    .select("*")
                    .eq("user_id", user_id)
                    .order("created_at", desc=True)
                    .execute()
                )
                return list(resp.data or [])
            except Exception as e:
                print(f"[SupabaseService] Failed to load workout sessions: {e}")
        return []

    def save_workout_session(self, session: dict[str, Any]) -> bool:
        """Persists a completed workout session to Supabase."""
        if self.is_connected and self.client:
            try:
                self.client.table("user_workout_sessions").insert(session).execute()
                return True
            except Exception as e:
                print(f"[SupabaseService] Failed to save workout session: {e}")
        return False

    def save_progress_state(self, user_id: str, state: dict[str, Any]) -> bool:
        """Persists the user's engine progression state to Supabase."""
        if self.is_connected and self.client:
            try:
                from datetime import datetime, timezone

                payload = {
                    "user_id": user_id,
                    "calendar_week": state.get("calendar_week", 1),
                    "overall_completion_pct": state.get("overall_completion_pct"),
                    "activity_rule_week": state.get("activity_rule_week", {}),
                    "exercise_rule_week": state.get("exercise_rule_week", {}),
                    "strength_variation_levels": state.get(
                        "strength_variation_levels", {}
                    ),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
                self.client.table("user_progress_state").upsert(
                    payload, on_conflict="user_id"
                ).execute()
                return True
            except Exception as e:
                print(f"[SupabaseService] Failed to save progress state: {e}")
        return False


supabase_service = SupabaseService()

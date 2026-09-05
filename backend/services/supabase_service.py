"""
UniFit Supabase Database & Plan Cache Service.

Provides persistence for profiles, weekly plans, and logs with graceful
in-memory caching when running in local development mode.
"""

from __future__ import annotations

import os
from uuid import UUID, uuid4
from typing import Any, Optional
from datetime import date
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("EXPO_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("EXPO_PUBLIC_SUPABASE_ANON_KEY")
    or os.getenv("SUPABASE_KEY", "")
)

# Columns that form the committed profile contract. Never spread arbitrary
# caller keys into a profile write.
PROFILE_COLUMNS = (
    "user_id",
    "full_name",
    "age",
    "sex",
    "height_cm",
    "weight_kg",
    "fitness_goal",
    "lifestyle_activity",
    "diet",
    "accessibility_needs",
    "accessibility_other_details",
    "blind_low_vision_resources",
    "has_exercise_restriction",
    "exercise_restriction_description",
    "strength_equipment",
    "strength_equipment_other",
    "strength_experience",
    "onboarding_completed",
    "preferred_activities",
    "profile_revision",
)


class ProfileConflictError(ValueError):
    """Raised when an edit is based on an outdated profile revision."""


class SupabaseService:
    def __init__(self):
        self.client = None
        self._live_credentials = False
        self._cached_weekly_plans: dict[str, dict[str, Any]] = {}
        self._plan_snapshots: dict[str, dict[str, Any]] = {}
        self._scheduled_workouts: dict[str, dict[str, Any]] = {}
        self._cached_profiles: dict[str, dict[str, Any]] = {}
        self._workout_sessions: dict[str, list[dict[str, Any]]] = {}

        if (
            SUPABASE_URL
            and "your-project-id" not in SUPABASE_URL
            and SUPABASE_KEY
            and "your-supabase" not in SUPABASE_KEY
        ):
            try:
                from supabase import create_client

                self.client = create_client(SUPABASE_URL, SUPABASE_KEY)
                self._live_credentials = True
            except Exception as e:
                print(f"[SupabaseService] Client init failed, using in-memory mode: {e}")
                self._live_credentials = False

    @property
    def is_connected(self) -> bool:
        """True when live Supabase is configured AND persistence is enabled.

        UNIFIT_PERSISTENCE=offline (or =memory) forces the service back to
        in-memory mode so deterministic engine tests never touch a live
        database, regardless of what .env contains.
        """
        mode = (os.getenv("UNIFIT_PERSISTENCE") or "").strip().lower()
        if mode in {"offline", "memory", "isolated", "test"}:
            return False
        return self._live_credentials

    def _require_user_id(self, user_id: Optional[str]) -> None:
        """Live Supabase rows key on auth.users UUIDs.

        In-memory dev mode keeps accepting arbitrary ids (test_veg_user,
        user_default, ...) so the engine works offline. Once Supabase is
        connected, fail fast with a clear message instead of letting
        PostgREST surface "invalid input syntax for type uuid".
        """
        if not self.is_connected:
            return
        if not user_id or user_id == "user_default":
            raise ValueError(
                "A real Supabase user_id (UUID) is required when Supabase "
                "persistence is enabled. Sign in through the app first."
            )
        try:
            UUID(str(user_id))
        except ValueError as exc:
            raise ValueError(
                f"user_id must be a Supabase UUID when persistence is "
                f"enabled (got {user_id!r})."
            ) from exc

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
            self._require_user_id(user_id)
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

    @staticmethod
    def _plan_identity_key(snapshot: dict[str, Any]) -> str:
        return ":".join(
            [
                str(snapshot.get("user_id", "")),
                str(snapshot.get("week_start_date", "")),
                str(snapshot.get("profile_revision", 0)),
                str(snapshot.get("progression_revision", 0)),
                str(snapshot.get("engine_version", "")),
                str(snapshot.get("rule_data_version", "")),
            ]
        )

    def get_active_plan_snapshot(
        self, user_id: str, week_start_date: str
    ) -> Optional[dict[str, Any]]:
        if not self.is_connected or self.client is None:
            matches = [
                row
                for row in self._plan_snapshots.values()
                if row.get("user_id") == user_id
                and str(row.get("week_start_date")) == week_start_date
                and row.get("status") == "active"
            ]
            return max(matches, key=lambda r: r.get("updated_at", "")) if matches else None
        try:
            resp = (
                self.client.table("user_plan_snapshots")
                .select("*")
                .eq("user_id", user_id)
                .eq("week_start_date", week_start_date)
                .eq("status", "active")
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            return resp.data[0] if resp.data else None
        except Exception as exc:
            print(f"[SupabaseService] Failed to load plan snapshot: {exc}")
            return None

    def save_plan_snapshot(
        self, user_id: str, snapshot: dict[str, Any]
    ) -> dict[str, Any]:
        """Persists a plan snapshot (and its scheduled workouts)."""
        self._require_user_id(user_id)
        identity_key = self._plan_identity_key(snapshot)

        if not self.is_connected or self.client is None:
            existing = self._plan_snapshots.get(identity_key)
            if existing:
                return dict(existing)
            row = dict(snapshot)
            row.setdefault("id", str(uuid4()))
            row.setdefault("status", "active")
            row.setdefault("created_at", datetime.now(timezone.utc).isoformat())
            row["updated_at"] = datetime.now(timezone.utc).isoformat()
            # Supersede previous snapshots for this user/week.
            for key, old in list(self._plan_snapshots.items()):
                if (
                    old.get("user_id") == user_id
                    and str(old.get("week_start_date"))
                    == str(snapshot.get("week_start_date"))
                    and old.get("status") == "active"
                ):
                    old["status"] = "superseded"
            self._plan_snapshots[identity_key] = row
            for scheduled in snapshot.get("scheduled_workouts", []):
                self._scheduled_workouts[
                    str(scheduled.get("id"))
                ] = {**scheduled, "plan_id": row["id"], "user_id": user_id}
            return dict(row)

        try:
            payload = {
                "user_id": user_id,
                "week_start_date": snapshot["week_start_date"],
                "week_number": snapshot["week_number"],
                "profile_revision": snapshot.get("profile_revision", 0),
                "progression_revision": snapshot.get("progression_revision", 1),
                "engine_version": snapshot.get("engine_version", ""),
                "rule_data_version": snapshot.get("rule_data_version", ""),
                "plan_data": snapshot.get("plan_data", {}),
                "status": "active",
            }
            self.client.table("user_plan_snapshots").update({"status": "superseded"}).eq(
                "user_id", user_id
            ).eq("week_start_date", snapshot["week_start_date"]).eq(
                "status", "active"
            ).execute()
            inserted = (
                self.client.table("user_plan_snapshots")
                .upsert(payload, on_conflict="user_id,week_start_date,profile_revision,progression_revision,engine_version,rule_data_version")
                .select("*")
                .execute()
            )
            row = inserted.data[0] if inserted.data else dict(payload)
            schedule_rows = []
            for scheduled in snapshot.get("scheduled_workouts", []):
                schedule_rows.append(
                    {
                        "id": scheduled["id"],
                        "user_id": user_id,
                        "plan_id": row["id"],
                        "local_date": scheduled["local_date"],
                        "activity_id": scheduled["activity_id"],
                        "requested_activity_id": scheduled.get("requested_activity_id"),
                        "progression_key": scheduled.get("progression_key"),
                        "session_type": scheduled.get("session_type"),
                        "is_rest_day": scheduled.get("is_rest_day", False),
                        "prescription": scheduled.get("prescription", {}),
                    }
                )
            if schedule_rows:
                self.client.table("scheduled_workouts").upsert(
                    schedule_rows, on_conflict="id"
                ).execute()
            return row
        except Exception as exc:
            print(f"[SupabaseService] Failed to persist plan snapshot: {exc}")
            raise ValueError("Unable to save the generated plan. Please try again.") from exc

    def save_profile(self, user_id: str, profile_data: dict[str, Any]) -> None:
        self._cached_profiles[user_id] = profile_data

        if self.is_connected and self.client:
            self._require_user_id(user_id)
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
        return self._cached_profiles.get(user_id)

    def commit_profile(
        self,
        user_id: str,
        profile: dict[str, Any],
        expected_revision: Optional[int] = None,
    ) -> dict[str, Any]:
        """Atomically commits the full profile row.

        Raises ProfileConflictError when expected_revision does not match the
        stored revision. Any other storage failure raises instead of being
        swallowed, so callers can never report a false success.
        """
        self._require_user_id(user_id)
        now_iso = datetime.now(timezone.utc).isoformat()
        payload = {key: profile.get(key) for key in PROFILE_COLUMNS if key in profile}
        payload["user_id"] = user_id
        payload["updated_at"] = now_iso
        payload.setdefault("preferred_activities", [])
        payload.setdefault("accessibility_needs", [])
        payload.setdefault("blind_low_vision_resources", [])
        payload.setdefault("strength_equipment", [])
        payload.setdefault("has_exercise_restriction", False)
        payload.setdefault("onboarding_completed", False)

        if not self.is_connected or self.client is None:
            existing = self._cached_profiles.get(user_id)
            if existing is not None:
                current = int(existing.get("profile_revision") or 0)
                if expected_revision is not None and current != int(expected_revision):
                    raise ProfileConflictError(
                        "Profile has changed. Refresh and try again."
                    )
                payload["profile_revision"] = current + 1
                payload["created_at"] = existing.get("created_at", now_iso)
            else:
                payload["profile_revision"] = 1
                payload["created_at"] = now_iso
            self._cached_profiles[user_id] = dict(payload)
            return dict(payload)

        try:
            fetched = (
                self.client.table("profiles")
                .select("id,profile_revision,created_at")
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            existing = fetched.data[0] if fetched.data else None

            if existing is not None:
                current = int(existing.get("profile_revision") or 0)
                if expected_revision is not None and current != int(expected_revision):
                    raise ProfileConflictError(
                        "Profile has changed. Refresh and try again."
                    )
                payload["profile_revision"] = current + 1
                payload["created_at"] = existing.get("created_at")
                updated = (
                    self.client.table("profiles")
                    .update(payload)
                    .eq("user_id", user_id)
                    .eq("profile_revision", current)
                    .select("*")
                    .execute()
                )
                if not updated.data:
                    raise ProfileConflictError(
                        "Profile has changed. Refresh and try again."
                    )
                row = updated.data[0]
            else:
                payload["profile_revision"] = 1
                inserted = (
                    self.client.table("profiles")
                    .insert(payload)
                    .select("*")
                    .execute()
                )
                row = inserted.data[0] if inserted.data else dict(payload)

            self._cached_profiles[user_id] = row
            return row
        except ProfileConflictError:
            raise
        except Exception as exc:
            print(f"[SupabaseService] Failed to commit profile: {exc}")
            raise ValueError("Unable to save your profile. Please try again.") from exc

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
        return list(self._workout_sessions.get(user_id, []))

    def save_workout_session(self, session: dict[str, Any]) -> bool:
        """Persists a completed workout session to Supabase."""
        if self.is_connected and self.client:
            self._require_user_id(session.get("user_id"))
            try:
                self.client.table("user_workout_sessions").insert(session).execute()
                return True
            except Exception as e:
                print(f"[SupabaseService] Failed to save workout session: {e}")
                return False
            return True
        # Offline / isolated mode: persist in the service's memory so retries,
        # streaks, and tests behave like a durable store.
        user_id = session.get("user_id") or "user_default"
        existing = self._workout_sessions.setdefault(user_id, [])
        operation_id = session.get("operation_id")
        if operation_id and any(
            row.get("operation_id") == operation_id for row in existing
        ):
            return True
        existing.append(dict(session))
        return True

    def get_workout_session_by_operation_id(
        self, user_id: str, operation_id: str
    ) -> Optional[dict[str, Any]]:
        if self.is_connected and self.client:
            try:
                resp = (
                    self.client.table("user_workout_sessions")
                    .select("*")
                    .eq("user_id", user_id)
                    .eq("operation_id", operation_id)
                    .limit(1)
                    .execute()
                )
                return resp.data[0] if resp.data else None
            except Exception as exc:
                print(f"[SupabaseService] Failed to find workout session: {exc}")
                return None
        for row in self._workout_sessions.get(user_id, []):
            if row.get("operation_id") == operation_id:
                return row
        return None

    def save_progress_state(self, user_id: str, state: dict[str, Any]) -> bool:
        """Persists the user's engine progression state to Supabase."""
        if self.is_connected and self.client:
            self._require_user_id(user_id)
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
            return True
        return True


supabase_service = SupabaseService()

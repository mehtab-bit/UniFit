"""W09 guided/manual activity logging schemas."""

from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel, Field

ActivityType = Literal["walking", "running", "cycling", "swimming"]


class ActivityLogCreate(BaseModel):
    activity_type: ActivityType
    local_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    source: Literal["guided", "manual"] = "guided"
    operation_id: Optional[str] = None
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
    active_duration_seconds: Optional[int] = Field(default=None, ge=0)
    duration_minutes: Optional[float] = Field(default=None, ge=0)
    distance_km: Optional[float] = Field(default=None, ge=0)
    distance_entered: bool = False
    completed: bool = False
    notes: Optional[str] = None


class ActivityLogResponse(BaseModel):
    id: str
    user_id: str
    activity_type: str
    local_date: str
    source: str
    operation_id: Optional[str] = None
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
    active_duration_seconds: Optional[int] = None
    duration_minutes: Optional[float] = None
    distance_km: Optional[float] = None
    distance_entered: bool = False
    completed: bool = False
    notes: Optional[str] = None
    created_at: Optional[str] = None

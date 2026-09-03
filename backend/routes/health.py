"""Health check endpoint."""

from fastapi import APIRouter
from datetime import datetime, timezone
from backend.services.supabase_service import supabase_service

router = APIRouter(tags=["Health"])


@router.get("/health")
def get_health_status():
    return {
        "status": "healthy",
        "service": "UniFit Fitness Engine API",
        "version": "1.0.0",
        "engine_connected": True,
        "database_connected": supabase_service.is_connected,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

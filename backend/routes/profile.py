"""Profile preview and onboarding validation endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from backend.schemas.profile import UserProfileRequest, ProfilePreviewResponse
from backend.services.engine_service import engine_service
from backend.services.supabase_service import supabase_service
from backend.routes.deps import require_user_dependency
from backend.services.auth_service import VerifiedUser, resolve_user_id

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.post("/preview", response_model=ProfilePreviewResponse)
def preview_profile(
    request: UserProfileRequest,
    verified: VerifiedUser = Depends(require_user_dependency),
):
    user_id = resolve_user_id(verified, request.user_id)
    try:
        engine_profile = engine_service.create_user_profile(
            age=request.age,
            sex=request.sex,
            height_cm=request.height_cm,
            weight_kg=request.weight_kg,
            goal=request.goal,
            lifestyle_activity=request.lifestyle_activity,
            diet=request.diet,
        )

        baseline = engine_service.calculate_baseline(engine_profile)

        # Cache profile if user_id is provided
        if user_id:
            supabase_service.save_profile(user_id, request.model_dump())

        # Determine target active days
        active_days_map = {
            "sedentary": 3,
            "light": 4,
            "moderate": 5,
            "very_active": 6,
        }

        return ProfilePreviewResponse(
            user={
                "age": request.age,
                "sex": request.sex,
                "height_cm": request.height_cm,
                "weight_kg": request.weight_kg,
                "goal": request.goal,
                "lifestyle_activity": request.lifestyle_activity,
                "diet": request.diet,
                "accessibility_id": request.accessibility_id,
            },
            bmr_kcal=baseline.bmr_kcal,
            baseline_maintenance_kcal=baseline.baseline_maintenance_kcal,
            goal_adjustment_percent=baseline.goal_adjustment_percent,
            protein_targets={
                "min_g": baseline.protein_min_g,
                "target_g": baseline.protein_target_g,
                "max_g": baseline.protein_max_g,
            },
            lifestyle_target_active_days=active_days_map.get(
                request.lifestyle_activity, 4
            ),
            accessibility_summary={
                "accessibility_id": request.accessibility_id,
                "resources": request.accessibility_resources,
            },
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

"""Profile preview and committed profile endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status

from backend.schemas.profile import (
    UserProfileRequest,
    ProfilePreviewResponse,
    ProfileWriteRequest,
    ProfileResponse,
)
from backend.services.engine_service import engine_service
from backend.services.supabase_service import (
    supabase_service,
    ProfileConflictError,
)
from backend.routes.deps import require_user_dependency
from backend.services.auth_service import VerifiedUser, resolve_user_id

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    verified: VerifiedUser = Depends(require_user_dependency),
) -> ProfileResponse:
    user_id = resolve_user_id(verified, None)
    row = supabase_service.get_profile(user_id)
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No committed profile exists for this account.",
        )
    return ProfileResponse.model_validate(row)


@router.put("/me", response_model=ProfileResponse)
def put_my_profile(
    request: ProfileWriteRequest,
    verified: VerifiedUser = Depends(require_user_dependency),
) -> ProfileResponse:
    user_id = resolve_user_id(verified, None)
    try:
        row = supabase_service.commit_profile(
            user_id=user_id,
            profile=request.model_dump(exclude_unset=True),
            expected_revision=request.expected_profile_revision,
        )
    except ProfileConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    return ProfileResponse.model_validate(row)


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

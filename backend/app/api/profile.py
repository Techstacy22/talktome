from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.profile import ProfileCreate, ProfileResponse, ProfileUpdate
from app.services import profile as profile_service

router = APIRouter()


@router.get("/me", response_model=ProfileResponse, summary="Get my profile")
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await profile_service.get_profile(db, current_user.id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


@router.post(
    "/",
    response_model=ProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create my profile",
)
async def create_profile(
    data: ProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = await profile_service.get_profile(db, current_user.id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile already exists. Use PUT to update.",
        )
    return await profile_service.create_profile(db, current_user.id, data)


@router.put("/", response_model=ProfileResponse, summary="Update my profile")
async def update_profile(
    data: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = await profile_service.update_profile(db, current_user.id, data)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Create one first with POST /api/profile/",
        )
    return profile


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT, summary="Delete my profile")
async def delete_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = await profile_service.delete_profile(db, current_user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

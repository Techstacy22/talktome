from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profile import Profile
from app.schemas.profile import ProfileCreate, ProfileUpdate


async def get_profile(db: AsyncSession, user_id: UUID) -> Profile | None:
    result = await db.execute(select(Profile).where(Profile.user_id == user_id))
    return result.scalar_one_or_none()


async def create_profile(db: AsyncSession, user_id: UUID, data: ProfileCreate) -> Profile:
    profile = Profile(user_id=user_id, **data.model_dump())
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


async def update_profile(
    db: AsyncSession, user_id: UUID, data: ProfileUpdate
) -> Profile | None:
    profile = await get_profile(db, user_id)
    if profile is None:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    await db.commit()
    await db.refresh(profile)
    return profile


async def delete_profile(db: AsyncSession, user_id: UUID) -> bool:
    profile = await get_profile(db, user_id)
    if profile is None:
        return False
    await db.delete(profile)
    await db.commit()
    return True

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ProfileCreate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    university: str | None = None
    major: str | None = None
    year: str | None = None
    bio: str | None = None
    timezone: str | None = None
    goals: str | None = None


class ProfileUpdate(ProfileCreate):
    pass


class ProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    first_name: str | None
    last_name: str | None
    university: str | None
    major: str | None
    year: str | None
    bio: str | None
    timezone: str | None
    goals: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

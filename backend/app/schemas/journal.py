from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator


class JournalCreate(BaseModel):
    title: str
    content: str

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Content cannot be empty")
        return v.strip()


class JournalUpdate(BaseModel):
    title: str | None = None
    content: str | None = None


class JournalResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

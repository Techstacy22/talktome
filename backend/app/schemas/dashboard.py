from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class JournalSummary(BaseModel):
    id: UUID
    title: str
    created_at: datetime
    model_config = {"from_attributes": True}


class ChatSummary(BaseModel):
    id: UUID
    title: str | None
    created_at: datetime
    model_config = {"from_attributes": True}


class DashboardStats(BaseModel):
    total_journals: int
    total_chats: int
    journal_streak: int


class DashboardResponse(BaseModel):
    stats: DashboardStats
    recent_journals: list[JournalSummary]
    recent_chats: list[ChatSummary]

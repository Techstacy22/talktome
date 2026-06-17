from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.memory import MemoryCategory, MemorySource


class MemoryCreate(BaseModel):
    category: MemoryCategory
    content: str
    source: MemorySource = MemorySource.manual


class MemoryResponse(BaseModel):
    id: UUID
    category: MemoryCategory
    content: str
    source: MemorySource
    created_at: datetime

    model_config = {"from_attributes": True}

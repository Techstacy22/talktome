from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, field_validator

from app.models.task import Priority, Status


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    priority: Priority = Priority.medium
    deadline: datetime | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: Priority | None = None
    status: Status | None = None
    deadline: datetime | None = None


class TaskResponse(BaseModel):
    id: UUID
    title: str
    description: str | None
    priority: Priority
    status: Status
    deadline: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

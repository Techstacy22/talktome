from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.chat import MessageRole


class ChatSessionCreate(BaseModel):
    title: str | None = None


class ChatSessionResponse(BaseModel):
    id: UUID
    title: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatMessageResponse(BaseModel):
    id: UUID
    session_id: UUID
    role: MessageRole
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatSessionWithMessages(ChatSessionResponse):
    messages: list[ChatMessageResponse]


class MessageRequest(BaseModel):
    content: str

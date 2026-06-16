from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.chat import ChatMessage, ChatSession, MessageRole
from app.schemas.chat import ChatSessionCreate


async def create_session(db: AsyncSession, user_id: UUID, data: ChatSessionCreate) -> ChatSession:
    session = ChatSession(user_id=user_id, title=data.title)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def get_sessions(db: AsyncSession, user_id: UUID) -> list[ChatSession]:
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == user_id)
        .order_by(ChatSession.created_at.desc())
    )
    return list(result.scalars().all())


async def get_session_with_messages(
    db: AsyncSession, session_id: UUID, user_id: UUID
) -> ChatSession | None:
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.id == session_id, ChatSession.user_id == user_id)
        .options(selectinload(ChatSession.messages))
    )
    return result.scalar_one_or_none()


async def add_message(
    db: AsyncSession, session_id: UUID, role: MessageRole, content: str
) -> ChatMessage:
    msg = ChatMessage(session_id=session_id, role=role, content=content)
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


async def save_ai_reply(session_id: UUID, content: str) -> None:
    """Opens its own session — used inside a streaming generator after response starts."""
    async with AsyncSessionLocal() as db:
        await add_message(db, session_id, MessageRole.assistant, content)


async def delete_session(db: AsyncSession, session_id: UUID, user_id: UUID) -> bool:
    session = await get_session_with_messages(db, session_id, user_id)
    if session is None:
        return False
    await db.delete(session)
    await db.commit()
    return True

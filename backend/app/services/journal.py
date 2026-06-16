from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.journal import Journal
from app.schemas.journal import JournalCreate, JournalUpdate


async def create_journal(db: AsyncSession, user_id: UUID, data: JournalCreate) -> Journal:
    entry = Journal(user_id=user_id, title=data.title, content=data.content)
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def get_journals(db: AsyncSession, user_id: UUID) -> list[Journal]:
    result = await db.execute(
        select(Journal)
        .where(Journal.user_id == user_id)
        .order_by(Journal.created_at.desc())
    )
    return list(result.scalars().all())


async def get_journal(db: AsyncSession, journal_id: UUID, user_id: UUID) -> Journal | None:
    result = await db.execute(
        select(Journal).where(Journal.id == journal_id, Journal.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def update_journal(
    db: AsyncSession, journal_id: UUID, user_id: UUID, data: JournalUpdate
) -> Journal | None:
    entry = await get_journal(db, journal_id, user_id)
    if entry is None:
        return None
    if data.title is not None:
        entry.title = data.title
    if data.content is not None:
        entry.content = data.content
    await db.commit()
    await db.refresh(entry)
    return entry


async def delete_journal(db: AsyncSession, journal_id: UUID, user_id: UUID) -> bool:
    entry = await get_journal(db, journal_id, user_id)
    if entry is None:
        return False
    await db.delete(entry)
    await db.commit()
    return True

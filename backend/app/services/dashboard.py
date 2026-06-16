from datetime import date, timedelta
from uuid import UUID

from sqlalchemy import Date, cast, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.chat import ChatSession
from app.models.journal import Journal


async def get_stats(db: AsyncSession, user_id: UUID) -> dict:
    j_count = await db.scalar(
        select(func.count()).select_from(Journal).where(Journal.user_id == user_id)
    )
    c_count = await db.scalar(
        select(func.count()).select_from(ChatSession).where(ChatSession.user_id == user_id)
    )
    streak = await _calc_streak(db, user_id)
    return {
        "total_journals": j_count or 0,
        "total_chats": c_count or 0,
        "journal_streak": streak,
    }


async def _calc_streak(db: AsyncSession, user_id: UUID) -> int:
    day_col = cast(Journal.created_at, Date)
    result = await db.execute(
        select(day_col.label("day"))
        .where(Journal.user_id == user_id)
        .group_by(day_col)
        .order_by(desc(day_col))
    )
    days = [row.day for row in result.all()]
    if not days:
        return 0
    today = date.today()
    if days[0] < today - timedelta(days=1):
        return 0
    streak = 0
    expected = today
    for d in days:
        if d == expected:
            streak += 1
            expected -= timedelta(days=1)
        elif d < expected:
            break
    return streak


async def get_recent_journals(db: AsyncSession, user_id: UUID, limit: int = 5):
    result = await db.execute(
        select(Journal)
        .where(Journal.user_id == user_id)
        .order_by(Journal.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


async def get_recent_chats(db: AsyncSession, user_id: UUID, limit: int = 3):
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == user_id)
        .order_by(ChatSession.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


async def generate_insight(
    name: str, journal_titles: list[str], chat_titles: list[str]
) -> str | None:
    if not journal_titles and not chat_titles:
        return None
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.openai_api_key)
    parts = []
    if journal_titles:
        parts.append(f"Journal entries: {', '.join(journal_titles[:5])}")
    if chat_titles:
        parts.append(f"Conversations: {', '.join(chat_titles[:3])}")
    prompt = (
        f"Based on {name}'s recent activity, write one encouraging, specific observation "
        f"(1 sentence, under 20 words).\n\n"
        + "\n".join(parts)
        + "\n\nReply with only the observation, no quotes."
    )
    try:
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=60,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return None

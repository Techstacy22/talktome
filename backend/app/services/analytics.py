from datetime import date, timedelta
from uuid import UUID

from openai import AsyncOpenAI
from sqlalchemy import Date, cast, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.chat import ChatSession
from app.models.journal import Journal
from app.models.memory import Memory
from app.models.mindmap import MindMap, MindMapNode
from app.schemas.analytics import ActivityDay, AnalyticsResponse, TopConcept, WritingStats


async def get_analytics(db: AsyncSession, user_id: UUID) -> AnalyticsResponse:
    stats = await _writing_stats(db, user_id)
    activity = await _activity_last_30(db, user_id)
    top_concepts = await _top_concepts(db, user_id)
    ai_narrative = await _generate_narrative(stats, top_concepts, activity)
    return AnalyticsResponse(
        stats=stats,
        activity=activity,
        top_concepts=top_concepts,
        ai_narrative=ai_narrative,
    )


async def _writing_stats(db: AsyncSession, user_id: UUID) -> WritingStats:
    journals = (
        await db.execute(select(Journal).where(Journal.user_id == user_id))
    ).scalars().all()

    total_journals = len(journals)
    total_chats = await db.scalar(
        select(func.count()).select_from(ChatSession).where(ChatSession.user_id == user_id)
    ) or 0
    memories_count = await db.scalar(
        select(func.count()).select_from(Memory).where(Memory.user_id == user_id)
    ) or 0

    word_counts = [len((j.content or "").split()) for j in journals]
    total_words = sum(word_counts)
    avg_words = (total_words // total_journals) if total_journals else 0
    longest_streak = await _longest_streak(db, user_id)

    return WritingStats(
        total_journals=total_journals,
        total_chats=total_chats,
        total_words=total_words,
        avg_words_per_journal=avg_words,
        longest_streak=longest_streak,
        memories_count=memories_count,
    )


async def _longest_streak(db: AsyncSession, user_id: UUID) -> int:
    day_col = cast(Journal.created_at, Date)
    result = await db.execute(
        select(day_col.label("day"))
        .where(Journal.user_id == user_id)
        .group_by(day_col)
        .order_by(day_col)
    )
    days = [row.day for row in result.all()]
    if not days:
        return 0
    best = current = 1
    for i in range(1, len(days)):
        if (days[i] - days[i - 1]).days == 1:
            current += 1
            best = max(best, current)
        else:
            current = 1
    return best


async def _activity_last_30(db: AsyncSession, user_id: UUID) -> list[ActivityDay]:
    today = date.today()
    start = today - timedelta(days=29)

    j_day = cast(Journal.created_at, Date)
    j_rows = (
        await db.execute(
            select(j_day.label("day"), func.count().label("cnt"))
            .where(Journal.user_id == user_id, j_day >= start)
            .group_by(j_day)
        )
    ).all()
    j_map = {row.day: row.cnt for row in j_rows}

    c_day = cast(ChatSession.created_at, Date)
    c_rows = (
        await db.execute(
            select(c_day.label("day"), func.count().label("cnt"))
            .where(ChatSession.user_id == user_id, c_day >= start)
            .group_by(c_day)
        )
    ).all()
    c_map = {row.day: row.cnt for row in c_rows}

    return [
        ActivityDay(
            date=str(start + timedelta(days=i)),
            journals=j_map.get(start + timedelta(days=i), 0),
            chats=c_map.get(start + timedelta(days=i), 0),
        )
        for i in range(30)
    ]


async def _top_concepts(db: AsyncSession, user_id: UUID) -> list[TopConcept]:
    mind_map = (
        await db.execute(select(MindMap).where(MindMap.user_id == user_id))
    ).scalar_one_or_none()
    if not mind_map:
        return []
    nodes = (
        await db.execute(
            select(MindMapNode)
            .where(MindMapNode.map_id == mind_map.id)
            .order_by(desc(MindMapNode.weight))
            .limit(10)
        )
    ).scalars().all()
    return [TopConcept(label=n.label, category=n.category, weight=n.weight) for n in nodes]


async def _generate_narrative(
    stats: WritingStats,
    concepts: list[TopConcept],
    activity: list[ActivityDay],
) -> str | None:
    if not settings.openai_api_key:
        return None
    active_days = sum(1 for d in activity if d.journals > 0 or d.chats > 0)
    if stats.total_journals == 0 and stats.total_chats == 0:
        return None

    concept_str = ", ".join(c.label for c in concepts[:6]) if concepts else "none yet"
    prompt = (
        f"Write a short, personalized analytics summary (3 sentences) for a student based on their data:\n"
        f"- {stats.total_journals} journals written, {stats.total_words} total words\n"
        f"- {stats.total_chats} AI conversations\n"
        f"- {active_days} active days in the last 30 days\n"
        f"- Longest writing streak: {stats.longest_streak} days\n"
        f"- Top concepts they explore: {concept_str}\n"
        f"- {stats.memories_count} personal memories saved\n\n"
        f"Be specific, warm, and insightful. Reference their actual topics. "
        f"End with one forward-looking encouragement."
    )
    kwargs: dict = {"api_key": settings.openai_api_key}
    if settings.ai_base_url:
        kwargs["base_url"] = settings.ai_base_url
    client = AsyncOpenAI(**kwargs)
    try:
        res = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=120,
            temperature=0.7,
        )
        return res.choices[0].message.content.strip()
    except Exception:
        return None

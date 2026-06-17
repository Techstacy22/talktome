import json
from uuid import UUID

from openai import AsyncOpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.chat import ChatMessage, ChatSession
from app.models.journal import Journal
from app.models.memory import Memory, MemoryCategory, MemorySource
from app.schemas.memory import MemoryCreate

EXTRACTION_PROMPT = """Analyze this content and extract important long-term facts about this student.

Return ONLY valid JSON (no markdown):
{{
  "memories": [
    {{"category": "goal|challenge|interest|preference|achievement|note", "content": "specific fact"}}
  ]
}}

Categories:
- goal: something they want to achieve
- challenge: obstacle or difficulty they're facing
- interest: topic, hobby, or passion they care about
- preference: how they like things done or communicated
- achievement: something they accomplished
- note: other important personal context

Rules:
- Extract 1-5 specific, personal, memorable facts
- Skip generic observations — keep it concrete and personal
- Do NOT repeat anything already known: [{existing}]

Content:
{content}"""


async def list_memories(db: AsyncSession, user_id: UUID) -> list[Memory]:
    result = await db.execute(
        select(Memory)
        .where(Memory.user_id == user_id)
        .order_by(Memory.created_at.desc())
    )
    return list(result.scalars().all())


async def create_memory(db: AsyncSession, user_id: UUID, data: MemoryCreate) -> Memory:
    memory = Memory(user_id=user_id, **data.model_dump())
    db.add(memory)
    await db.commit()
    await db.refresh(memory)
    return memory


async def delete_memory(db: AsyncSession, user_id: UUID, memory_id: UUID) -> bool:
    result = await db.execute(
        select(Memory).where(Memory.id == memory_id, Memory.user_id == user_id)
    )
    memory = result.scalar_one_or_none()
    if not memory:
        return False
    await db.delete(memory)
    await db.commit()
    return True


async def _extract(text: str, existing: list[Memory]) -> list[dict]:
    """Call AI to extract new memories from text. Returns list of {category, content} dicts."""
    if not settings.openai_api_key:
        return []
    existing_str = "; ".join(m.content for m in existing) if existing else "none"
    kwargs: dict = {"api_key": settings.openai_api_key}
    if settings.ai_base_url:
        kwargs["base_url"] = settings.ai_base_url
    client = AsyncOpenAI(**kwargs)
    try:
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "user", "content": EXTRACTION_PROMPT.format(
                    content=text[:4000], existing=existing_str
                )}
            ],
            max_tokens=400,
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        data = json.loads(response.choices[0].message.content)
        return data.get("memories", [])
    except Exception:
        return []


async def extract_from_journal(
    db: AsyncSession, user_id: UUID, journal_id: UUID
) -> list[Memory]:
    journal = (
        await db.execute(
            select(Journal).where(Journal.id == journal_id, Journal.user_id == user_id)
        )
    ).scalar_one_or_none()
    if not journal:
        return []

    existing = await list_memories(db, user_id)
    text = f"Title: {journal.title}\n\n{journal.content or ''}"
    extracted = await _extract(text, existing)
    return await _save_extracted(db, user_id, extracted, MemorySource.journal)


async def extract_from_chat(
    db: AsyncSession, user_id: UUID, session_id: UUID
) -> list[Memory]:
    session = (
        await db.execute(
            select(ChatSession).where(
                ChatSession.id == session_id, ChatSession.user_id == user_id
            )
        )
    ).scalar_one_or_none()
    if not session:
        return []

    messages = (
        await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at)
            .limit(40)
        )
    ).scalars().all()

    text = "\n".join(f"{m.role}: {m.content}" for m in messages)
    existing = await list_memories(db, user_id)
    extracted = await _extract(text, existing)
    return await _save_extracted(db, user_id, extracted, MemorySource.chat)


async def _save_extracted(
    db: AsyncSession, user_id: UUID, items: list[dict], source: MemorySource
) -> list[Memory]:
    saved = []
    for item in items:
        cat_str = item.get("category", "note")
        try:
            category = MemoryCategory(cat_str)
        except ValueError:
            category = MemoryCategory.note
        content = str(item.get("content", "")).strip()
        if not content:
            continue
        memory = Memory(user_id=user_id, category=category, content=content, source=source)
        db.add(memory)
        saved.append(memory)
    if saved:
        await db.commit()
        for m in saved:
            await db.refresh(m)
    return saved


def build_memory_context(memories: list[Memory]) -> str:
    """Format memories into a system-prompt block."""
    if not memories:
        return ""
    by_cat: dict[str, list[str]] = {}
    for m in memories:
        by_cat.setdefault(m.category.value, []).append(m.content)
    lines = [f"• {cat.capitalize()}: {'; '.join(items)}" for cat, items in by_cat.items()]
    return (
        "\n\nWhat you know about this student (use naturally, don't recite):\n"
        + "\n".join(lines)
    )

import json
from uuid import UUID

from openai import AsyncOpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.chat import ChatMessage, ChatSession
from app.models.journal import Journal
from app.models.mindmap import MindMap, MindMapEdge, MindMapNode

VALID_CATEGORIES = {"goal", "challenge", "interest", "person", "topic", "emotion", "skill"}

EXTRACTION_PROMPT = """Analyze this student's writing and extract key concepts for their personal knowledge graph.

Return ONLY valid JSON (no markdown, no extra text):
{{
  "nodes": [
    {{"label": "Concept Name", "category": "goal|challenge|interest|person|topic|emotion|skill"}}
  ],
  "edges": [
    {{"source": "Concept A", "target": "Concept B", "relationship": "brief relationship"}}
  ]
}}

Rules:
- Extract 3-8 important, specific concepts (not generic words)
- goal=something to achieve, challenge=obstacle/difficulty, interest=passion/hobby,
  person=someone mentioned, topic=subject discussed, emotion=feeling, skill=capability
- Each edge source/target must exactly match a node label
- 0-5 edges maximum

Content:
{content}"""


async def _get_or_create_map(db: AsyncSession, user_id: UUID) -> MindMap:
    result = await db.execute(select(MindMap).where(MindMap.user_id == user_id))
    mind_map = result.scalar_one_or_none()
    if mind_map is None:
        mind_map = MindMap(user_id=user_id)
        db.add(mind_map)
        await db.flush()
    return mind_map


async def get_full_map(db: AsyncSession, user_id: UUID) -> dict:
    mind_map = await _get_or_create_map(db, user_id)
    await db.commit()

    nodes = (
        await db.execute(select(MindMapNode).where(MindMapNode.map_id == mind_map.id))
    ).scalars().all()
    edges = (
        await db.execute(select(MindMapEdge).where(MindMapEdge.map_id == mind_map.id))
    ).scalars().all()

    return {
        "map_id": mind_map.id,
        "nodes": nodes,
        "edges": edges,
        "updated_at": mind_map.updated_at,
    }


async def _extract_concepts(text: str) -> dict | None:
    if not settings.openai_api_key:
        return None
    kwargs: dict = {"api_key": settings.openai_api_key}
    if settings.ai_base_url:
        kwargs["base_url"] = settings.ai_base_url
    client = AsyncOpenAI(**kwargs)
    try:
        response = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "user", "content": EXTRACTION_PROMPT.format(content=text[:3000])}
            ],
            max_tokens=600,
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)
    except Exception:
        return None


async def _merge_extraction(db: AsyncSession, map_id: UUID, extraction: dict) -> None:
    # Load existing nodes keyed by lowercase label
    existing_nodes: dict[str, MindMapNode] = {
        n.label.lower(): n
        for n in (
            await db.execute(select(MindMapNode).where(MindMapNode.map_id == map_id))
        ).scalars().all()
    }

    # Upsert nodes, build label → node map for edge creation
    label_to_node: dict[str, MindMapNode] = {}
    for n in extraction.get("nodes", []):
        label = n.get("label", "").strip()
        if not label:
            continue
        category = n.get("category", "topic")
        if category not in VALID_CATEGORIES:
            category = "topic"
        key = label.lower()
        if key in existing_nodes:
            existing_nodes[key].weight = round(existing_nodes[key].weight + 1.0, 1)
            label_to_node[key] = existing_nodes[key]
        else:
            node = MindMapNode(map_id=map_id, label=label, category=category, weight=1.0)
            db.add(node)
            await db.flush()
            existing_nodes[key] = node
            label_to_node[key] = node

    # Load existing edges keyed by (source_id, target_id)
    existing_edges: dict[tuple, MindMapEdge] = {
        (str(e.source_node_id), str(e.target_node_id)): e
        for e in (
            await db.execute(select(MindMapEdge).where(MindMapEdge.map_id == map_id))
        ).scalars().all()
    }

    for e in extraction.get("edges", []):
        src_key = e.get("source", "").strip().lower()
        tgt_key = e.get("target", "").strip().lower()
        src = label_to_node.get(src_key) or existing_nodes.get(src_key)
        tgt = label_to_node.get(tgt_key) or existing_nodes.get(tgt_key)
        if not src or not tgt or src.id == tgt.id:
            continue
        edge_key = (str(src.id), str(tgt.id))
        if edge_key in existing_edges:
            existing_edges[edge_key].weight = round(existing_edges[edge_key].weight + 1.0, 1)
        else:
            edge = MindMapEdge(
                map_id=map_id,
                source_node_id=src.id,
                target_node_id=tgt.id,
                relationship_label=e.get("relationship", ""),
                weight=1.0,
            )
            db.add(edge)


async def process_journal(db: AsyncSession, user_id: UUID, journal_id: UUID) -> dict | None:
    journal = (
        await db.execute(
            select(Journal).where(Journal.id == journal_id, Journal.user_id == user_id)
        )
    ).scalar_one_or_none()
    if not journal:
        return None

    text = f"Title: {journal.title}\n\n{journal.content or ''}"
    extraction = await _extract_concepts(text)
    if not extraction:
        return await get_full_map(db, user_id)

    mind_map = await _get_or_create_map(db, user_id)
    await _merge_extraction(db, mind_map.id, extraction)
    await db.commit()
    return await get_full_map(db, user_id)


async def process_chat(db: AsyncSession, user_id: UUID, session_id: UUID) -> dict | None:
    session = (
        await db.execute(
            select(ChatSession).where(
                ChatSession.id == session_id, ChatSession.user_id == user_id
            )
        )
    ).scalar_one_or_none()
    if not session:
        return None

    messages = (
        await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at)
            .limit(30)
        )
    ).scalars().all()

    text = "\n".join(f"{m.role}: {m.content}" for m in messages)
    extraction = await _extract_concepts(text)
    if not extraction:
        return await get_full_map(db, user_id)

    mind_map = await _get_or_create_map(db, user_id)
    await _merge_extraction(db, mind_map.id, extraction)
    await db.commit()
    return await get_full_map(db, user_id)


async def delete_node(db: AsyncSession, user_id: UUID, node_id: UUID) -> bool:
    mind_map = (
        await db.execute(select(MindMap).where(MindMap.user_id == user_id))
    ).scalar_one_or_none()
    if not mind_map:
        return False
    node = (
        await db.execute(
            select(MindMapNode).where(
                MindMapNode.id == node_id, MindMapNode.map_id == mind_map.id
            )
        )
    ).scalar_one_or_none()
    if not node:
        return False
    await db.delete(node)
    await db.commit()
    return True


async def clear_map(db: AsyncSession, user_id: UUID) -> None:
    mind_map = (
        await db.execute(select(MindMap).where(MindMap.user_id == user_id))
    ).scalar_one_or_none()
    if mind_map:
        await db.delete(mind_map)
        await db.commit()

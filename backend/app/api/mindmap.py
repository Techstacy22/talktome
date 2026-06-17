from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.mindmap import MindMapResponse
from app.services import mindmap as mindmap_service

router = APIRouter()


@router.get("/", response_model=MindMapResponse)
async def get_mind_map(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await mindmap_service.get_full_map(db, current_user.id)


@router.post("/process/journal/{journal_id}", response_model=MindMapResponse)
async def process_journal(
    journal_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await mindmap_service.process_journal(db, current_user.id, journal_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal not found")
    return result


@router.post("/process/chat/{session_id}", response_model=MindMapResponse)
async def process_chat(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await mindmap_service.process_chat(db, current_user.id, session_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")
    return result


@router.delete("/nodes/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_node(
    node_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await mindmap_service.delete_node(db, current_user.id, node_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Node not found")


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def clear_mind_map(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await mindmap_service.clear_map(db, current_user.id)

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.memory import MemoryCreate, MemoryResponse
from app.services import memory as memory_service

router = APIRouter(prefix="/memories", tags=["memories"])


@router.get("/", response_model=list[MemoryResponse])
async def list_memories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await memory_service.list_memories(db, current_user.id)


@router.post("/", response_model=MemoryResponse, status_code=status.HTTP_201_CREATED)
async def create_memory(
    data: MemoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await memory_service.create_memory(db, current_user.id, data)


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_memory(
    memory_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await memory_service.delete_memory(db, current_user.id, memory_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Memory not found")


@router.post("/extract/journal/{journal_id}", response_model=list[MemoryResponse])
async def extract_from_journal(
    journal_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await memory_service.extract_from_journal(db, current_user.id, journal_id)


@router.post("/extract/chat/{session_id}", response_model=list[MemoryResponse])
async def extract_from_chat(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await memory_service.extract_from_chat(db, current_user.id, session_id)

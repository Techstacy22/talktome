from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.journal import JournalCreate, JournalResponse, JournalUpdate
from app.services import journal as journal_service

router = APIRouter()


@router.post(
    "/",
    response_model=JournalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a journal entry",
)
async def create_journal(
    data: JournalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await journal_service.create_journal(db, current_user.id, data)


@router.get(
    "/",
    response_model=list[JournalResponse],
    summary="Get all my journal entries",
)
async def list_journals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await journal_service.get_journals(db, current_user.id)


@router.get(
    "/{journal_id}",
    response_model=JournalResponse,
    summary="Get a single journal entry",
)
async def get_journal(
    journal_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = await journal_service.get_journal(db, journal_id, current_user.id)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal not found")
    return entry


@router.put(
    "/{journal_id}",
    response_model=JournalResponse,
    summary="Update a journal entry",
)
async def update_journal(
    journal_id: UUID,
    data: JournalUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = await journal_service.update_journal(db, journal_id, current_user.id, data)
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal not found")
    return entry


@router.delete(
    "/{journal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a journal entry",
)
async def delete_journal(
    journal_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = await journal_service.delete_journal(db, journal_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal not found")

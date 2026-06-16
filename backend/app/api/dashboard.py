from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardResponse, DashboardStats
from app.services import dashboard as dashboard_service
from app.services import profile as profile_service

router = APIRouter()


@router.get("/", response_model=DashboardResponse)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stats = await dashboard_service.get_stats(db, current_user.id)
    recent_journals = await dashboard_service.get_recent_journals(db, current_user.id)
    recent_chats = await dashboard_service.get_recent_chats(db, current_user.id)
    return DashboardResponse(
        stats=DashboardStats(**stats),
        recent_journals=recent_journals,
        recent_chats=recent_chats,
    )


@router.get("/insight")
async def get_insight(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await profile_service.get_profile(db, current_user.id)
    name = (profile.first_name if profile else None) or current_user.username
    journals = await dashboard_service.get_recent_journals(db, current_user.id, limit=10)
    chats = await dashboard_service.get_recent_chats(db, current_user.id, limit=5)
    insight = await dashboard_service.generate_insight(
        name=name,
        journal_titles=[j.title for j in journals],
        chat_titles=[c.title for c in chats if c.title],
    )
    return {"insight": insight}

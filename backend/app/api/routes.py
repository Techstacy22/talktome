from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.dashboard import router as dashboard_router
from app.api.journals import router as journals_router
from app.api.profile import router as profile_router
from app.database import get_db

router = APIRouter()

router.include_router(auth_router, prefix="/auth", tags=["Auth"])
router.include_router(journals_router, prefix="/journals", tags=["Journals"])
router.include_router(chat_router, prefix="/chat", tags=["Chat"])
router.include_router(profile_router, prefix="/profile", tags=["Profile"])
router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])


@router.get("/health", tags=["Health"])
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "unreachable"

    return {"status": "ok", "database": db_status}

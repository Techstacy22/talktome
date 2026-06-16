from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.journals import router as journals_router

router = APIRouter()

router.include_router(auth_router, prefix="/auth", tags=["Auth"])
router.include_router(journals_router, prefix="/journals", tags=["Journals"])


@router.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}

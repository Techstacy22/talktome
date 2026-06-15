from fastapi import APIRouter

from app.api.auth import router as auth_router

router = APIRouter()

router.include_router(auth_router, prefix="/auth", tags=["Auth"])


@router.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}

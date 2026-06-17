import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

import bcrypt
from jose import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.schemas.token import TokenData


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> TokenData:
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise ValueError("Token missing subject")
    return TokenData(user_id=UUID(user_id))


def _hash_refresh(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


async def create_refresh_token(db: AsyncSession, user_id: UUID) -> str:
    from app.models.token import RefreshToken
    raw = secrets.token_urlsafe(64)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    rt = RefreshToken(user_id=user_id, token_hash=_hash_refresh(raw), expires_at=expires_at)
    db.add(rt)
    await db.commit()
    return raw


async def verify_refresh_token(db: AsyncSession, raw: str):
    from app.models.token import RefreshToken
    token_hash = _hash_refresh(raw)
    rt = (
        await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    ).scalar_one_or_none()
    if not rt or rt.revoked:
        return None
    if rt.expires_at < datetime.now(timezone.utc):
        return None
    return rt


async def revoke_refresh_token(db: AsyncSession, raw: str) -> bool:
    from app.models.token import RefreshToken
    token_hash = _hash_refresh(raw)
    rt = (
        await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    ).scalar_one_or_none()
    if not rt:
        return False
    rt.revoked = True
    await db.commit()
    return True

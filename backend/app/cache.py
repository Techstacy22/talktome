import json
import logging
from typing import Any

logger = logging.getLogger(__name__)

_redis = None


def _get_client():
    global _redis
    if _redis is not None:
        return _redis
    try:
        from app.config import settings
        if not settings.redis_url:
            return None
        import redis.asyncio as aioredis
        _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
        return _redis
    except Exception as exc:
        logger.warning("Redis unavailable, caching disabled: %s", exc)
        return None


async def cache_get(key: str) -> Any | None:
    client = _get_client()
    if client is None:
        return None
    try:
        raw = await client.get(key)
        return json.loads(raw) if raw is not None else None
    except Exception as exc:
        logger.warning("cache_get error: %s", exc)
        return None


async def cache_set(key: str, value: Any, ttl: int = 300) -> None:
    client = _get_client()
    if client is None:
        return
    try:
        await client.setex(key, ttl, json.dumps(value))
    except Exception as exc:
        logger.warning("cache_set error: %s", exc)


async def cache_delete(key: str) -> None:
    client = _get_client()
    if client is None:
        return
    try:
        await client.delete(key)
    except Exception as exc:
        logger.warning("cache_delete error: %s", exc)

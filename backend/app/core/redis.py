from typing import Optional
import redis.asyncio as aioredis
from app.core.config import get_settings

redis_pool: Optional[aioredis.ConnectionPool] = None


def get_redis_pool() -> aioredis.ConnectionPool:
    global redis_pool
    if redis_pool is None:
        settings = get_settings()
        redis_pool = aioredis.ConnectionPool.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            max_connections=50,
        )
    return redis_pool


def get_redis() -> aioredis.Redis:
    pool = get_redis_pool()
    return aioredis.Redis(connection_pool=pool)


async def close_redis() -> None:
    global redis_pool
    if redis_pool is not None:
        await redis_pool.disconnect()
        redis_pool = None


async def ping_redis() -> bool:
    client = get_redis()
    try:
        response = await client.ping()
        return bool(response)
    except Exception:
        return False
    finally:
        await client.aclose()

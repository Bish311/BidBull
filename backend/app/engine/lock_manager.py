import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import uuid
import redis.asyncio as aioredis
from app.core.errors import ConcurrencyConflictError

DEFAULT_LOCK_TTL_SECONDS = 5
MAX_RETRY_ATTEMPTS = 5
RETRY_DELAY_SECONDS = 0.05


@asynccontextmanager
async def acquire_auction_lock(
    redis_client: aioredis.Redis,
    item_id: uuid.UUID,
    ttl_seconds: int = DEFAULT_LOCK_TTL_SECONDS
) -> AsyncGenerator[bool, None]:
    lock_key = f"auction:{item_id}:lock"
    lock_token = str(uuid.uuid4())
    acquired = False
    attempts = 0

    while attempts < MAX_RETRY_ATTEMPTS:
        result = await redis_client.set(
            lock_key, lock_token, ex=ttl_seconds, nx=True
        )
        if result:
            acquired = True
            break
        attempts = attempts + 1
        await asyncio.sleep(RETRY_DELAY_SECONDS)

    if not acquired:
        raise ConcurrencyConflictError()

    try:
        yield True
    finally:
        current_token = await redis_client.get(lock_key)
        if current_token == lock_token:
            await redis_client.delete(lock_key)

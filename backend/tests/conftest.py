import os
import sys
from pathlib import Path

# Ensure backend root is on sys.path regardless of how pytest is invoked
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

import asyncio
from collections.abc import AsyncGenerator
from datetime import datetime, timedelta, timezone
from typing import Any
import uuid
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.database import Base, get_db
from app.core.redis import get_redis
from app.core.security import hash_password
from app.main import app
from app.models import Item, User

TEST_DATABASE_URL = "sqlite+aiosqlite:///test_bidbull.db"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 30},
    echo=False,
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class MockRedisPubSub:
    async def subscribe(self, *channels: str) -> None:
        pass

    async def unsubscribe(self, *channels: str) -> None:
        pass

    async def listen(self) -> AsyncGenerator[dict[str, Any], None]:
        if False:
            yield {}

    async def aclose(self) -> None:
        pass


class MockRedis:
    def __init__(self) -> None:
        self.store: dict[str, str] = {}

    async def set(self, key: str, value: str, ex: int | None = None, nx: bool = False) -> bool:
        if nx and key in self.store:
            return False
        self.store[key] = str(value)
        return True

    async def get(self, key: str) -> str | None:
        return self.store.get(key)

    async def delete(self, key: str) -> int:
        if key in self.store:
            del self.store[key]
            return 1
        return 0

    async def ping(self) -> bool:
        return True

    async def publish(self, channel: str, message: str) -> int:
        return 1

    def pubsub(self) -> MockRedisPubSub:
        return MockRedisPubSub()

    async def aclose(self) -> None:
        pass


mock_redis_instance = MockRedis()


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session


def override_get_redis() -> MockRedis:
    return mock_redis_instance


app.dependency_overrides[get_db] = override_get_db




@pytest.fixture(autouse=True)
async def setup_test_database():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(autouse=True)
def mock_redis(monkeypatch) -> MockRedis:
    async def mock_ping() -> bool:
        return True

    monkeypatch.setattr("app.api.bids.get_redis", override_get_redis)
    monkeypatch.setattr("app.core.redis.get_redis", override_get_redis)
    monkeypatch.setattr("app.core.redis.ping_redis", mock_ping)
    monkeypatch.setattr("app.api.websocket.get_redis", override_get_redis)
    return mock_redis_instance


@pytest.fixture
async def async_client(mock_redis) -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture
async def seed_users() -> dict[str, User]:
    async with TestingSessionLocal() as session:
        user1 = User(
            username="Bish1",
            email="bish1@example.com",
            password_hash=hash_password("SecurePassword123"),
        )
        user2 = User(
            username="Bish2",
            email="bish2@example.com",
            password_hash=hash_password("SecurePassword123"),
        )
        user3 = User(
            username="Bishwayan1",
            email="bishwayan1@example.com",
            password_hash=hash_password("SecurePassword123"),
        )
        session.add_all([user1, user2, user3])
        await session.commit()
        await session.refresh(user1)
        await session.refresh(user2)
        await session.refresh(user3)
        return {"bish1": user1, "bish2": user2, "bishwayan1": user3}


@pytest.fixture
async def active_item(seed_users: dict[str, User]) -> Item:
    async with TestingSessionLocal() as session:
        seller = seed_users["bish1"]
        now = datetime.now(timezone.utc)
        item = Item(
            seller_id=seller.id,
            title="Collectible Mechanical Chronograph",
            description="Rare timepiece with exhibition caseback.",
            image_url="/images/watch.webp",
            starting_price_cents=5000,
            reserve_price_cents=10000,
            current_price_cents=5000,
            status="ACTIVE",
            starts_at=now - timedelta(minutes=30),
            expires_at=now + timedelta(hours=2),
        )
        session.add(item)
        await session.commit()
        await session.refresh(item)
        return item
